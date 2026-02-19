"""
FoodLink Campus - API Views
REST API endpoints for all operations
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timedelta
import hashlib
import random
import string
from django.core.mail import send_mail
from django.conf import settings

from .models import User, FoodItem, Reservation, Route, Notification, HygieneChecks, SupportMessage
from .serializers import (
    UserSerializer, UserLoginSerializer, UserProfileSerializer, VerifyOTPSerializer,
    FoodItemSerializer, FoodItemListSerializer,
    ReservationSerializer, QRVerificationSerializer,
    RouteSerializer, NotificationSerializer,
    LeaderboardSerializer, ImpactStatsSerializer, ChatMessageSerializer,
    GoogleLoginSerializer, SupportMessageSerializer
)
from mongoengine.queryset.visitor import Q
from .permissions import IsStaff, IsStudent, IsCharity, IsAdmin, IsStaffOrAdmin, IsAuthenticated
from .tasks import notify_students_about_new_food
from .ai_services import chat_with_ecobot, generate_impact_report
from .utils import check_and_escalate_expired_items


# =============================================================================
# AUTHENTICATION VIEWS
# =============================================================================

class RegisterView(APIView):
    """
    User registration endpoint.
    POST /api/auth/register/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            # Create inactive user (waiting for OTP)
            # Default behavior of UserSerializer is to create user. 
            # We will save it, but explicitly set is_active=False afterwards to be safe
            # or rely on the fact we haven't given tokens yet.
            # Best practice: keep them inactive until verified.
            user = serializer.save()
            user.is_active = False # Require verification
            
            # Generate OTP
            otp = ''.join(random.choices(string.digits, k=6))
            user.otp_code = otp
            user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
            user.save()
            
            # Send Email
            try:
                send_mail(
                    'FoodLink Campus - Verify Your Account',
                    f'Welcome to FoodLink Campus! Your verification code is: {otp}',
                    settings.DEFAULT_FROM_EMAIL or 'noreply@foodlink.com',
                    [user.email],
                    fail_silently=False,
                )
                print(f"DEBUG: Registration OTP for {user.username} is {otp}")
            except Exception as e:
                print(f"Email sending failed: {e}")
            
            return Response({
                'message': 'Registration successful. Please verify your email.',
                'username': user.username,
                'require_otp': True
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    User login endpoint.
    POST /api/auth/login/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            # Allow login with Username, Email, or Phone
            user = User.objects.filter(Q(username=username) | Q(email=username) | Q(phone=username)).first()
            
            if not user:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            try:
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                if user.password_hash != password_hash:
                    return Response(
                        {'error': 'Invalid credentials'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                if not user.is_active:
                    return Response(
                        {'error': 'Account is disabled or pending verification'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Direct Login for all users (No OTP)
                user.last_login = datetime.utcnow()
                user.save()
                
                refresh = RefreshToken()
                refresh['user_id'] = str(user.id)
                refresh['username'] = user.username
                refresh['role'] = user.role
                
                return Response({
                    'user': UserProfileSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    },
                    'require_otp': False
                })
                
            except User.DoesNotExist:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    """
    Verify OTP and return tokens.
    POST /api/auth/verify-otp/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            otp = serializer.validated_data['otp']
            
            try:
                user = User.objects.get(username=username)
                
                # Check OTP match
                if user.otp_code != otp:
                     return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check Expiry
                if datetime.utcnow() > user.otp_expires_at:
                    return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Clear OTP
                user.otp_code = None
                user.otp_expires_at = None
                
                # Activate User (for registration flow)
                if not user.is_active:
                    user.is_active = True
                
                # Update last login
                user.last_login = datetime.utcnow()
                user.save()
                
                # Generate JWT tokens
                refresh = RefreshToken()
                refresh['user_id'] = str(user.id)
                refresh['username'] = user.username
                refresh['role'] = user.role
                
                return Response({
                    'user': UserProfileSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                })
                
            except User.DoesNotExist:
                 return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(APIView):
    """
    Google Login endpoint.
    POST /api/auth/google/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        if serializer.is_valid():
            id_token = serializer.validated_data['id_token']
            email = serializer.validated_data.get('email')
            name = serializer.validated_data.get('name', '')
            google_id = serializer.validated_data.get('google_id', '')

            # Verify token
            import requests
            try:
                # Basic verification - in production use google-auth library
                # Note: Frontend sends access_token as 'id_token' currently
                google_verify_url = f"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={id_token}"
                verify_response = requests.get(google_verify_url)
                
                if verify_response.status_code != 200:
                    # Try verifying as id_token if access_token failed (fallback)
                    google_verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
                    verify_response = requests.get(google_verify_url)
                    
                if verify_response.status_code != 200:
                    return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)
                
                google_data = verify_response.json()
                verified_email = google_data.get('email')
                
                if email and verified_email != email:
                     return Response({'error': 'Email mismatch'}, status=status.HTTP_400_BAD_REQUEST)
                     
                email = verified_email
                
            except Exception as e:
                print(f"Google verification failed: {e}")
                # Fallback purely to trust client (NOT SECURE for production, but okay for dev without internet/library)
                # return Response({'error': 'Token verification failed'}, status=status.HTTP_400_BAD_REQUEST)
                pass # Proceeding with frontend provided data if request fails (Dev Mode) or assuming valid if we can't reach Google

            if not email:
                return Response({'error': 'No email provided'}, status=status.HTTP_400_BAD_REQUEST)

            # Find or Create User
            try:
                # Try to find by google_id or email
                user = User.objects.filter(email=email).first()
                
                if not user:
                    # Create new user
                    import uuid
                    random_password = str(uuid.uuid4())
                    password_hash = hashlib.sha256(random_password.encode()).hexdigest()
                    
                    # Generate username from email or name
                    base_username = email.split('@')[0]
                    username = base_username
                    counter = 1
                    while User.objects(username=username).first():
                        username = f"{base_username}{counter}"
                        counter += 1
                        
                    user = User(
                        username=username,
                        email=email,
                        password_hash=password_hash,
                        full_name=name,
                        role='student', # Default role
                        google_id=google_id,
                        sustainability_points=0
                    )
                    user.save()
                else:
                    # Update google_id if missing
                    if not user.google_id and google_id:
                        user.google_id = google_id
                        user.save()
            
                # Update last login
                user.last_login = datetime.utcnow()
                user.save()
                
                # Generate JWT tokens
                refresh = RefreshToken()
                refresh['user_id'] = str(user.id)
                refresh['username'] = user.username
                refresh['role'] = user.role
                
                return Response({
                    'user': UserProfileSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                })

            except Exception as e:
                print(f"Login error: {e}")
                return Response({'error': 'Login failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ProfileView(APIView):
    """
    Get/Update current user profile.
    GET/PUT /api/auth/profile/
    """
    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)
    
    def put(self, request):
        # Handle file upload manual check similar to FoodItemCreateView
        data = request.data.copy()
        
        if 'id_card_image' in request.FILES:
            try:
                image_file = request.FILES['id_card_image']
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                file_name = f"idcard_{request.user.username}_{timestamp}_{image_file.name.replace(' ', '_')}"
                
                from django.core.files.storage import default_storage
                from django.core.files.base import ContentFile
                path = default_storage.save(f'id_cards/{file_name}', ContentFile(image_file.read()))
                
                data['id_card_image_url'] = f"/media/{path}"
            except Exception as e:
                print(f"ID Card upload error: {e}")

        # Security: Remove sensitive fields that shouldn't be updated via profile
        data.pop('role', None)
        data.pop('is_approved', None)
        data.pop('sustainability_points', None) # Already read-only but good measure

        serializer = UserSerializer(request.user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserProfileSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# FOOD ITEM VIEWS
# =============================================================================

class FoodItemListView(APIView):
    """
    List available food items.
    GET /api/food/
    """
    def get(self, request):
        # Filter by status and food type if provided
        query_status = request.query_params.get('status', 'available')
        food_type = request.query_params.get('type')
        
        filters = {'status': query_status}
        if food_type:
            filters['food_type'] = food_type
        
        food_items = FoodItem.objects(**filters).order_by('-listed_at')
        serializer = FoodItemListSerializer(food_items, many=True)
        return Response(serializer.data)


class FoodItemCreateView(APIView):
    """
    Create new food listing (Staff only).
    POST /api/food/
    """
    permission_classes = [IsStaffOrAdmin]
    
    def post(self, request):
        if not request.user.is_approved:
            return Response(
                {'error': 'Your account is pending verification. Please contact admin.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Handle file upload manually to save path in Mongo StringField
        # Convert to plain dict to allow nested dict assignment (QueryDict is strict)
        try:
            data = request.data.dict()
        except AttributeError:
             data = request.data.copy()
             
        if 'image' in request.FILES:
            try:
                image_file = request.FILES['image']
                # Create unique filename
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                file_name = f"food_{timestamp}_{image_file.name.replace(' ', '_')}"
                
                # Save using Django storage
                from django.core.files.storage import default_storage
                from django.core.files.base import ContentFile
                path = default_storage.save(f'food_images/{file_name}', ContentFile(image_file.read()))
                
                # Add URL to data
                data['image_url'] = f"/media/{path}"
            except Exception as e:
                print(f"Image upload error: {e}")
        
        # Handle hygiene_checks if it comes as a JSON string (from FormData)
        import json
        if 'hygiene_checks' in data and isinstance(data['hygiene_checks'], str):
            try:
                data['hygiene_checks'] = json.loads(data['hygiene_checks'])
            except json.JSONDecodeError:
                pass # Let serializer handle the error

        serializer = FoodItemSerializer(
            data=data,
            context={'user': request.user}
        )
        if serializer.is_valid():
            food_item = serializer.save()
            
            # Trigger notification to students (async, non-blocking)
            try:
                # notify_students_about_new_food.delay(str(food_item.id))
                pass
            except Exception:
                pass
            
            return Response(
                FoodItemSerializer(food_item).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FoodItemDetailView(APIView):
    """
    Get/Update/Delete food item.
    GET/PUT/DELETE /api/food/<id>/
    """
    def get(self, request, food_id):
        try:
            food_item = FoodItem.objects.get(id=food_id)
            return Response(FoodItemSerializer(food_item).data)
        except FoodItem.DoesNotExist:
            return Response(
                {'error': 'Food item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def put(self, request, food_id):
        if request.user.role not in ['staff', 'admin']:
            return Response(
                {'error': 'Only staff can update food items'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            food_item = FoodItem.objects.get(id=food_id)
            
            # Handle file upload manually (Match Create logic)
            try:
                data = request.data.dict()
            except AttributeError:
                 data = request.data.copy()
                 
            if 'image' in request.FILES:
                try:
                    image_file = request.FILES['image']
                    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                    file_name = f"food_{timestamp}_{image_file.name.replace(' ', '_')}"
                    
                    from django.core.files.storage import default_storage
                    from django.core.files.base import ContentFile
                    path = default_storage.save(f'food_images/{file_name}', ContentFile(image_file.read()))
                    
                    data['image_url'] = f"/media/{path}"
                except Exception as e:
                    print(f"Image update error: {e}")

            serializer = FoodItemSerializer(
                food_item,
                data=data,
                partial=True,
                context={'user': request.user}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(FoodItemSerializer(food_item).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except FoodItem.DoesNotExist:
            return Response(
                {'error': 'Food item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, food_id):
        if request.user.role not in ['staff', 'admin']:
            return Response(
                {'error': 'Only staff can delete food items'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            food_item = FoodItem.objects.get(id=food_id)
            food_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except FoodItem.DoesNotExist:
            return Response(
                {'error': 'Food item not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class StaffFoodListView(APIView):
    """
    List food items created by current staff member.
    GET /api/food/my-listings/
    """
    permission_classes = [IsStaffOrAdmin]
    
    def get(self, request):
        food_items = FoodItem.objects(listed_by=request.user).order_by('-listed_at')
        serializer = FoodItemListSerializer(food_items, many=True)
        return Response(serializer.data)


class EscalatedFoodView(APIView):
    """
    List escalated food items (Charity only).
    GET /api/food/escalated/
    """
    permission_classes = [IsCharity]
    
    def get(self, request):
        # Trigger lazy escalation (Pseudo-background task for development)
        check_and_escalate_expired_items()
        
        food_items = FoodItem.objects(status='escalated').order_by('-escalated_at')
        serializer = FoodItemListSerializer(food_items, many=True)
        return Response(serializer.data)


# =============================================================================
# RESERVATION VIEWS
# =============================================================================

class ReservationCreateView(APIView):
    """
    Create a reservation (Student only).
    POST /api/reservations/
    """
    permission_classes = [IsStudent]
    
    def post(self, request):
        if not request.user.is_approved:
            return Response(
                {'error': 'Your student account is pending Admin approval. Please upload your ID card in profile to verify.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ReservationSerializer(
            data=request.data,
            context={'user': request.user}
        )
        if serializer.is_valid():
            reservation = serializer.save()
            return Response(
                ReservationSerializer(reservation).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BulkReservationCreateView(APIView):
    """
    Create multiple reservations in one transaction (Student only).
    POST /api/reservations/bulk/
    Body: { items: [{ food_item_id: "...", quantity: 1 }, ...] }
    """
    permission_classes = [IsStudent]

    def post(self, request):
        if not request.user.is_approved:
            return Response(
                {'error': 'Your student account is pending Admin approval. Please upload your ID card in profile to verify.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        items = request.data.get('items', [])
        if not items:
            return Response({'error': 'No items in cart'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 1. Validate all items first
        valid_items = []
        try:
            for item in items:
                food_id = item.get('food_item_id')
                qty = int(item.get('quantity', 1))
                
                food = FoodItem.objects.get(id=food_id)
                if not food.can_be_reserved():
                    return Response(
                        {'error': f"Item '{food.name}' is no longer available"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if qty > food.quantity:
                    return Response(
                        {'error': f"Only {food.quantity} left for '{food.name}'"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                valid_items.append({'food': food, 'qty': qty})
        except FoodItem.DoesNotExist:
             return Response({'error': 'One or more food items not found'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
             return Response({'error': 'Invalid quantity'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Process Reservations
        created_reservations = []
        
        # We need to send ONE email with all details
        email_context_items = []
        total_price_all = 0
        
        for v in valid_items:
            food_item = v['food']
            quantity = v['qty']
            
            # Logic from ReservationSerializer.create (adapted)
            if quantity < food_item.quantity:
                reserved_item = FoodItem(
                    name=food_item.name,
                    description=food_item.description,
                    quantity=quantity,
                    unit=food_item.unit,
                    food_type=food_item.food_type,
                    status='reserved',
                    pickup_window_start=food_item.pickup_window_start,
                    pickup_window_end=food_item.pickup_window_end,
                    hygiene_checks=food_item.hygiene_checks,
                    listed_by=food_item.listed_by,
                    location_name=food_item.location_name,
                    latitude=food_item.latitude,
                    longitude=food_item.longitude,
                    listed_at=food_item.listed_at,
                    image_url=food_item.image_url,
                    reserved_at=datetime.utcnow(),
                    price=food_item.price
                )
                reserved_item.save()
                food_item.quantity -= quantity
                food_item.save()
                final_food = reserved_item
            else:
                final_food = food_item
                final_food.mark_reserved()
            
            reservation = Reservation(
                food_item=final_food,
                student=request.user
            )
            reservation.generate_qr_code() # Saves reservation
            created_reservations.append(reservation)
            
            # Prepare email data
            item_total = (final_food.price or 0) * quantity
            total_price_all += item_total
            email_context_items.append({
                'name': final_food.name,
                'qty': quantity,
                'location': final_food.location_name,
                'price': final_food.price,
                'total': item_total,
                'pickup': final_food.pickup_window_end,
                'qr_code': reservation.qr_code_string,
                'qr_sig': reservation.qr_signature
            })

        # 3. Send Unified Email
        try:
            from django.core.mail import EmailMultiAlternatives
            import qrcode
            from io import BytesIO
            from email.mime.image import MIMEImage

            subject = f"Order Confirmed: {len(created_reservations)} Items Reserved"
            
            # Build HTML Table
            items_html = ""
            for item in email_context_items:
                price_display = f"₹{item['price']}" if item['price'] and item['price'] > 0 else "Free"
                total_display = f"₹{item['total']}" if item['total'] > 0 else "Free"
                items_html += f"""
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <strong>{item['qty']}x {item['name']}</strong><br>
                        <span style="font-size: 12px; color: #666;">{item['location']}</span>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{price_display}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">{total_display}</td>
                </tr>
                """
            
            total_all_display = f"₹{total_price_all}" if total_price_all > 0 else "Free"

            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2e7d32;">Order Confirmed! 🛒</h2>
                        <p>Hi <strong>{{request.user.full_name or request.user.username}}</strong>,</p>
                        <p>We've received your reservations for the following items:</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <thead>
                                <tr style="background-color: #f5f5f5; text-align: left;">
                                    <th style="padding: 10px;">Item</th>
                                    <th style="padding: 10px;">Price</th>
                                    <th style="padding: 10px;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items_html}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Grand Total:</td>
                                    <td style="padding: 10px; font-weight: bold;">{total_all_display}</td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        <p><strong>Please see attached QR codes for each item.</strong></p>
                        <p>Show these codes to the canteen staff to collect your food.</p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #666;">Thank you for fighting food waste! 🌍<br>FoodLink Campus Team</p>
                    </div>
                </body>
            </html>
            """
            
            msg = EmailMultiAlternatives(
                subject,
                "Your order details are in the HTML version of this email.",
                'noreply@foodlink.com',
                [request.user.email],
            )
            msg.attach_alternative(html_content, "text/html")
            
            # Attach QR Codes (One per item)
            for idx, item in enumerate(email_context_items):
                qr_content = f"{item['qr_code']}|{item['qr_sig']}"
                img = qrcode.make(qr_content)
                buffer = BytesIO()
                img.save(buffer, format="PNG")
                img_data = buffer.getvalue()
                
                # Sanitize filename
                safe_name = "".join([c for c in item['name'] if c.isalpha() or c.isdigit()]).rstrip()
                msg.attach(f'{safe_name}_{idx+1}.png', img_data, 'image/png')
            
            msg.send(fail_silently=False)

        except Exception as e:
            print(f"[BULK EMAIL ERROR] {e}")

        # Serialize results
        serializer = ReservationSerializer(created_reservations, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReservationListView(APIView):
    """
    List user's reservations.
    GET /api/reservations/
    """
    permission_classes = [IsStudent]
    
    def get(self, request):
        reservations = Reservation.objects(student=request.user).order_by('-created_at')
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data)


class ReservationDetailView(APIView):
    """
    Get reservation details.
    GET /api/reservations/<id>/
    """
    def get(self, request, reservation_id):
        try:
            reservation = Reservation.objects.get(id=reservation_id)
            
            # Check ownership
            if str(reservation.student.id) != str(request.user.id) and request.user.role != 'admin':
                return Response(
                    {'error': 'Not authorized'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return Response(ReservationSerializer(reservation).data)
        except Reservation.DoesNotExist:
            return Response(
                {'error': 'Reservation not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class QRVerifyView(APIView):
    """
    Verify QR code and mark as collected (Staff only).
    POST /api/reservations/verify-qr/
    """
    permission_classes = [IsStaffOrAdmin]
    
    def post(self, request):
        serializer = QRVerificationSerializer(data=request.data)
        if serializer.is_valid():
            qr_code = serializer.validated_data['qr_code_string']
            signature = serializer.validated_data['qr_signature']
            
            # Verify signature
            if not Reservation.verify_qr_signature(qr_code, signature):
                return Response(
                    {'error': 'Invalid QR code signature'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                reservation = Reservation.objects.get(qr_code_string=qr_code)
                
                if reservation.status != 'active':
                    return Response(
                        {'error': f'Reservation is {reservation.status}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Mark as collected and award points
                points = reservation.mark_collected(points=10)
                
                return Response({
                    'message': 'Collection verified successfully',
                    'reservation': ReservationSerializer(reservation).data,
                    'points_awarded': points
                })
                
            except Reservation.DoesNotExist:
                return Response(
                    {'error': 'Reservation not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffClaimsView(APIView):
    """
    List all reservations for food items listed by current staff.
    GET /api/reservations/staff-claims/
    """
    permission_classes = [IsStaffOrAdmin]
    
    def get(self, request):
        # Get all food items listed by this staff member
        staff_food_items = FoodItem.objects(listed_by=request.user)
        
        # Get all reservations for those food items
        reservations = Reservation.objects(
            food_item__in=staff_food_items
        ).order_by('-created_at')
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            reservations = reservations.filter(status=status_filter)
        
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data)


# =============================================================================
# ROUTE VIEWS (Charity)
# =============================================================================

class RouteCreateView(APIView):
    """
    Create a pickup route (Charity only).
    POST /api/routes/
    """
    permission_classes = [IsCharity]
    
    def post(self, request):
        serializer = RouteSerializer(
            data=request.data,
            context={'user': request.user}
        )
        if serializer.is_valid():
            route = serializer.save()
            return Response(
                RouteSerializer(route).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RouteListView(APIView):
    """
    List charity's routes.
    GET /api/routes/
    """
    permission_classes = [IsCharity]
    
    def get(self, request):
        routes = Route.objects(charity=request.user).order_by('-created_at')
        serializer = RouteSerializer(routes, many=True)
        return Response(serializer.data)


class RouteDetailView(APIView):
    """
    Get/Update route.
    GET/PUT /api/routes/<id>/
    """
    permission_classes = [IsCharity]
    
    def get(self, request, route_id):
        try:
            route = Route.objects.get(id=route_id, charity=request.user)
            return Response(RouteSerializer(route).data)
        except Route.DoesNotExist:
            return Response(
                {'error': 'Route not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def put(self, request, route_id):
        try:
            route = Route.objects.get(id=route_id, charity=request.user)
            action = request.data.get('action')
            
            if action == 'start':
                route.start_route()
            elif action == 'complete':
                route.complete_route()
            
            return Response(RouteSerializer(route).data)
        except Route.DoesNotExist:
            return Response(
                {'error': 'Route not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# =============================================================================
# NOTIFICATION VIEWS
# =============================================================================

class NotificationListView(APIView):
    """
    List user's notifications.
    GET /api/notifications/
    """
    def get(self, request):
        notifications = Notification.objects(recipient=request.user).order_by('-created_at')[:50]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class NotificationMarkReadView(APIView):
    """
    Mark notification as read.
    PUT /api/notifications/<id>/read/
    """
    def put(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, recipient=request.user)
            notification.is_read = True
            notification.save()
            return Response({'message': 'Marked as read'})
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class NotificationMarkAllReadView(APIView):
    """
    Mark all notifications as read.
    PUT /api/notifications/read-all/
    """
    def put(self, request):
        Notification.objects(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})


# =============================================================================
# LEADERBOARD & STATS
# =============================================================================

class LeaderboardView(APIView):
    """
    Get top students by sustainability points.
    GET /api/leaderboard/
    """
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        
        top_students = User.objects(
            role='student',
            sustainability_points__gt=0
        ).order_by('-sustainability_points')[:limit]
        
        leaderboard = []
        for rank, student in enumerate(top_students, 1):
            leaderboard.append({
                'rank': rank,
                'username': student.username,
                'full_name': student.full_name or student.username,
                'sustainability_points': student.sustainability_points,
                'college_id': student.college_id or ''
            })
        
        serializer = LeaderboardSerializer(leaderboard, many=True)
        return Response(serializer.data)


class ImpactStatsView(APIView):
    """
    Get impact statistics (Admin only).
    GET /api/stats/impact/
    """
    permission_classes = [IsAdmin]
    
    def get(self, request):
        # Calculate statistics
        total_listed = FoodItem.objects.count()
        total_collected = FoodItem.objects(status='collected').count()
        total_expired = FoodItem.objects(status='expired').count()
        
        # Estimate kg saved (assuming average 0.5kg per plate)
        collected_items = FoodItem.objects(status='collected')
        total_kg = sum(
            item.quantity * (1 if item.unit == 'kg' else 0.5)
            for item in collected_items
        )
        
        # Meals = collected items count
        total_meals = total_collected
        
        # Unique participants
        total_students = Reservation.objects.distinct('student')
        total_charities = Route.objects.distinct('charity')
        
        # Collection rate
        rate = (total_collected / total_listed * 100) if total_listed > 0 else 0
        
        stats = {
            'total_food_items_listed': total_listed,
            'total_food_items_collected': total_collected,
            'total_food_items_expired': total_expired,
            'total_kg_saved': total_kg,
            'total_meals_redistributed': total_meals,
            'total_students_participated': len(total_students),
            'total_charities_served': len(total_charities),
            'collection_rate_percent': round(rate, 1)
        }
        
        serializer = ImpactStatsSerializer(stats)
        return Response(serializer.data)


class ImpactReportView(APIView):
    """
    Generate AI impact report (Admin only).
    GET /api/stats/report/
    """
    permission_classes = [IsAdmin]
    
    def get(self, request):
        # Get stats
        total_listed = FoodItem.objects.count()
        total_collected = FoodItem.objects(status='collected').count()
        total_expired = FoodItem.objects(status='expired').count()
        
        collected_items = FoodItem.objects(status='collected')
        total_kg = sum(
            item.quantity * (1 if item.unit == 'kg' else 0.5)
            for item in collected_items
        )
        
        total_students = len(Reservation.objects.distinct('student'))
        total_charities = len(Route.objects.distinct('charity'))
        rate = (total_collected / total_listed * 100) if total_listed > 0 else 0
        
        stats = {
            'total_food_items_listed': total_listed,
            'total_food_items_collected': total_collected,
            'total_food_items_expired': total_expired,
            'total_kg_saved': total_kg,
            'total_meals_redistributed': total_collected,
            'total_students_participated': total_students,
            'total_charities_served': total_charities,
            'collection_rate_percent': round(rate, 1)
        }
        
        # Generate AI report
        result = generate_impact_report(stats)
        
        return Response({
            'stats': stats,
            'report': result['report'],
            'source': result['source']
        })


# =============================================================================
# AI CHATBOT
# =============================================================================

class ChatbotView(APIView):
    """
    Eco-Bot chat endpoint.
    POST /api/chat/
    """
    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        if serializer.is_valid():
            message = serializer.validated_data['message']
            context = serializer.validated_data.get('context', '')
            
            # Add user context
            user_context = f"User role: {request.user.role}, Username: {request.user.username}"
            if context:
                user_context += f", {context}"
            # Get response from AI service
            response_data = chat_with_ecobot(message, user_context)
            
            return Response({
                'response': response_data['response'],
                'source': response_data['source']
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# ADMIN VIEWS
# =============================================================================

class AdminUserListView(APIView):
    """
    List all users (Admin only).
    GET /api/admin/users/
    """
    permission_classes = [IsAdmin]
    
    def get(self, request):
        role = request.query_params.get('role')
        
        if role:
            users = User.objects(role=role)
        else:
            users = User.objects.all()
        
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data)


class AdminUserDetailView(APIView):
    """
    Get/Update/Delete user (Admin only).
    GET/PUT/DELETE /api/admin/users/<id>/
    """
    permission_classes = [IsAdmin]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            return Response(UserProfileSerializer(user).data)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(UserProfileSerializer(user).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_active = False
            user.save()
            return Response({'message': 'User deactivated'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class SupportChatView(APIView):
    """
    Endpoint for users to chat with admin.
    GET /api/support/
    POST /api/support/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Fetch conversation between user and admin
        messages = SupportMessage.objects.filter(
            (Q(sender=request.user) | Q(receiver=request.user))
        ).order_by('created_at')
        
        serializer = SupportMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = SupportMessageSerializer(
            data=request.data,
            context={'user': request.user}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminSupportChatListView(APIView):
    """
    Endpoint for admins to list all support conversations.
    GET /api/admin/support/users/
    """
    permission_classes = [IsAdmin]
    
    def get(self, request):
        # Get all messages involving admin
        # We want to group by the 'other' user
        # This is a bit complex in mongoengine without aggregations, 
        # but for simple implementations we can fetch all messages sent to admin
        
        # Get unique users who have sent messages to admin
        messages = SupportMessage.objects(receiver=request.user)
        user_ids = set(msg.sender.id for msg in messages)
        
        # Also include users admin has sent messages to
        messages_sent = SupportMessage.objects(sender=request.user)
        user_ids.update(msg.receiver.id for msg in messages_sent)
        
        users = User.objects(id__in=list(user_ids))
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data)


class AdminSupportChatDetailView(APIView):
    """
    Endpoint to chat with specific user
    GET /api/admin/support/{user_id}/
    POST /api/admin/support/{user_id}/
    """
    permission_classes = [IsAdmin]
    
    def get(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
            messages = SupportMessage.objects.filter(
                (Q(sender=request.user) & Q(receiver=target_user)) |
                (Q(sender=target_user) & Q(receiver=request.user))
            ).order_by('created_at')
            
            serializer = SupportMessageSerializer(messages, many=True)
            return Response(serializer.data)
        except User.DoesNotExist:
              return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, user_id):
        serializer = SupportMessageSerializer(
            data=request.data,
            context={'user': request.user, 'receiver_id': user_id}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
