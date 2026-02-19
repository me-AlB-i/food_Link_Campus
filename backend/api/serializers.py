"""
FoodLink Campus - DRF Serializers
Handles JSON serialization/deserialization for API
"""
from rest_framework import serializers
from datetime import datetime
from .models import User, FoodItem, HygieneChecks, Reservation, Route, Notification, SupportMessage
import hashlib

# ... existing code ...

class HygieneChecksSerializer(serializers.Serializer):
    """Serializer for embedded hygiene checks"""
    temp_check = serializers.BooleanField(default=False)
    packaging_clean = serializers.BooleanField(default=False)
    safe_storage = serializers.BooleanField(default=False)
    
    def validate(self, data):
        """Ensure all checks pass for valid submission"""
        if not all([data.get('temp_check'), data.get('packaging_clean'), data.get('safe_storage')]):
            raise serializers.ValidationError(
                "All hygiene checks must be completed before listing food."
            )
        return data


class UserSerializer(serializers.Serializer):
    """User serializer for registration and profile"""
    id = serializers.CharField(read_only=True)
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(
        choices=['student', 'staff', 'charity', 'admin'],
        default='student'
    )
    college_id = serializers.CharField(max_length=20, required=False, allow_blank=True)
    full_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    sustainability_points = serializers.IntegerField(read_only=True)
    organization_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    organization_address = serializers.CharField(max_length=500, required=False, allow_blank=True)
    institution_type = serializers.ChoiceField(choices=['School', 'Canteen'], required=False)
    institution_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    id_card_image_url = serializers.CharField(required=False, allow_blank=True)
    is_approved = serializers.BooleanField(required=False)
    created_at = serializers.DateTimeField(read_only=True)
    
    def create(self, validated_data):
        """Create new user with hashed password"""
        password = validated_data.pop('password')
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        if validated_data.get('role') in ['staff', 'student']:
            validated_data['is_approved'] = False
        
        user = User(
            password_hash=password_hash,
            **validated_data
        )
        user.save()
        return user
    
    def update(self, instance, validated_data):
        """Update user profile"""
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        for key, value in validated_data.items():
            if key != 'id':
                setattr(instance, key, value)
        
        instance.save()
        return instance


class UserLoginSerializer(serializers.Serializer):
    """Serializer for login endpoint"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    username = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=6)


class GoogleLoginSerializer(serializers.Serializer):
    """Serializer for Google login"""
    id_token = serializers.CharField()
    email = serializers.EmailField(required=False)
    name = serializers.CharField(required=False)
    google_id = serializers.CharField(required=False)


class UserProfileSerializer(serializers.Serializer):
    """Read-only user profile (no password)"""
    id = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    role = serializers.CharField(read_only=True)
    college_id = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    sustainability_points = serializers.IntegerField(read_only=True)
    organization_name = serializers.CharField(read_only=True)
    id_card_image_url = serializers.CharField(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class FoodItemSerializer(serializers.Serializer):
    """Serializer for food item CRUD"""
    id = serializers.SerializerMethodField()
    name = serializers.CharField(max_length=100)
    description = serializers.CharField(max_length=500, required=False, allow_blank=True)
    quantity = serializers.IntegerField(min_value=1)
    unit = serializers.ChoiceField(
        choices=['plates', 'kg', 'liters', 'pieces'],
        default='plates'
    )
    food_type = serializers.ChoiceField(choices=['veg', 'non-veg'])
    status = serializers.CharField(read_only=True)
    
    pickup_window_start = serializers.DateTimeField(required=False)
    pickup_window_end = serializers.DateTimeField()
    
    hygiene_checks = HygieneChecksSerializer()
    
    listed_by = UserProfileSerializer(read_only=True)
    listed_by_id = serializers.CharField(write_only=True, required=False)
    
    location_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    latitude = serializers.CharField(required=False, allow_blank=True)
    longitude = serializers.CharField(required=False, allow_blank=True)
    
    listed_at = serializers.DateTimeField(read_only=True)
    image_url = serializers.CharField(required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, min_value=0)
    retail_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, min_value=0)
    
    # Computed fields
    can_reserve = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    
    def get_can_reserve(self, obj):
        """Check if item can still be reserved"""
        if hasattr(obj, 'can_be_reserved'):
            return obj.can_be_reserved()
        return False
    
    def get_id(self, obj):
        """Convert ObjectId to string"""
        return str(obj.id) if obj.id else None
    
    def get_time_remaining(self, obj):
        """Calculate time remaining until pickup window ends"""
        if obj.pickup_window_end:
            pickup_end = obj.pickup_window_end
            # Handle timezone-aware datetimes by converting to naive
            if pickup_end.tzinfo is not None:
                pickup_end = pickup_end.replace(tzinfo=None)
            delta = pickup_end - datetime.utcnow()
            if delta.total_seconds() > 0:
                hours = int(delta.total_seconds() // 3600)
                minutes = int((delta.total_seconds() % 3600) // 60)
                return f"{hours}h {minutes}m"
        return "Expired"
    
    def create(self, validated_data):
        """Create new food item"""
        hygiene_data = validated_data.pop('hygiene_checks')
        hygiene_checks = HygieneChecks(**hygiene_data)
        
        # Get the user from context (set by view)
        user = self.context.get('user')
        if not user:
            listed_by_id = validated_data.pop('listed_by_id', None)
            if listed_by_id:
                user = User.objects.get(id=listed_by_id)
        
        food_item = FoodItem(
            hygiene_checks=hygiene_checks,
            listed_by=user,
            **validated_data
        )
        food_item.save()
        return food_item
    
    def update(self, instance, validated_data):
        """Update food item"""
        if 'hygiene_checks' in validated_data:
            hygiene_data = validated_data.pop('hygiene_checks')
            instance.hygiene_checks = HygieneChecks(**hygiene_data)
        
        for key, value in validated_data.items():
            if key not in ['id', 'listed_by_id']:
                setattr(instance, key, value)
        
        instance.save()
        return instance


class FoodItemListSerializer(serializers.Serializer):
    """Lightweight serializer for food item list view"""
    id = serializers.SerializerMethodField()
    name = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    quantity = serializers.IntegerField(read_only=True)
    unit = serializers.CharField(read_only=True)
    food_type = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    pickup_window_end = serializers.DateTimeField(read_only=True)
    location_name = serializers.CharField(read_only=True)
    latitude = serializers.CharField(read_only=True)
    longitude = serializers.CharField(read_only=True)
    listed_at = serializers.DateTimeField(read_only=True)
    image_url = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    retail_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    can_reserve = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    
    def get_id(self, obj):
        """Convert ObjectId to string"""
        return str(obj.id) if obj.id else None
    
    def get_can_reserve(self, obj):
        if hasattr(obj, 'can_be_reserved'):
            return obj.can_be_reserved()
        return False
    
    def get_time_remaining(self, obj):
        if obj.pickup_window_end:
            pickup_end = obj.pickup_window_end
            # Handle timezone-aware datetimes by converting to naive
            if pickup_end.tzinfo is not None:
                pickup_end = pickup_end.replace(tzinfo=None)
            delta = pickup_end - datetime.utcnow()
            if delta.total_seconds() > 0:
                hours = int(delta.total_seconds() // 3600)
                minutes = int((delta.total_seconds() % 3600) // 60)
                return f"{hours}h {minutes}m"
        return "Expired"


class ReservationSerializer(serializers.Serializer):
    """Serializer for reservations"""
    id = serializers.CharField(read_only=True)
    food_item = FoodItemListSerializer(read_only=True)
    food_item_id = serializers.CharField(write_only=True)
    quantity = serializers.IntegerField(default=1, min_value=1, write_only=True)
    student = UserProfileSerializer(read_only=True)
    qr_code_string = serializers.CharField(read_only=True)
    qr_signature = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    collected_at = serializers.DateTimeField(read_only=True)
    points_awarded = serializers.IntegerField(read_only=True)
    
    def create(self, validated_data):
        """Create reservation with QR code generation"""
        food_item_id = validated_data.pop('food_item_id')
        quantity = validated_data.get('quantity', 1)
        food_item = FoodItem.objects.get(id=food_item_id)
        
        if not food_item.can_be_reserved():
            raise serializers.ValidationError("This food item is no longer available.")
            
        if quantity > food_item.quantity:
             raise serializers.ValidationError(f"Only {food_item.quantity} items available.")

        student = self.context.get('user')
        
        # Handle splitting if needed
        if quantity < food_item.quantity:
            # Create new food item for the reservation
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
                reserved_at=datetime.utcnow()
            )
            reserved_item.save()
            
            # Update original item
            food_item.quantity -= quantity
            food_item.save()
            
            food_item_to_reserve = reserved_item
        else:
            # Reserve the whole item
            food_item_to_reserve = food_item
            food_item_to_reserve.mark_reserved()

        reservation = Reservation(
            food_item=food_item_to_reserve,
            student=student
        )
        reservation.save()
        
        # Generate QR code
        reservation.generate_qr_code()
        
        # Send Email Notification with QR Code attachment
        try:
            from django.core.mail import EmailMultiAlternatives
            from django.conf import settings
            import qrcode
            from io import BytesIO
            import os
            from email.mime.image import MIMEImage

            subject = f"Reserved: {food_item.name}"
            
            # Calculate total price
            total_price = (food_item.price or 0) * quantity
            total_price_str = f"₹{total_price}" if total_price > 0 else "Free"

            # Plain text version
            text_content = (
                f"Hi {student.full_name or student.username},\n\n"
                f"You have confirmed {quantity}x {food_item.name}.\n"
                f"Location: {food_item.location_name}\n"
                f"Price: {f'₹{food_item.price}' if food_item.price and food_item.price > 0 else 'Free'}\n"
                f"Total: {total_price_str}\n"
                f"Pickup by: {food_item.pickup_window_end}\n\n"
                f"Please find your QR code attached to this email.\n"
                f"Show it to the canteen staff to collect your food.\n\n"
                f"FoodLink Team"
            )
            
            # Determine image source
            image_cid = None
            image_data = None
            image_filename = None
            image_src = ""

            if food_item.image_url:
                if food_item.image_url.startswith('http'):
                    # Remote URL
                    image_src = food_item.image_url
                elif food_item.image_url.startswith('/media/'):
                    # Local file - Embedded CID
                    try:
                        #/media/food_images/xxx.jpg -> food_images/xxx.jpg
                        relative_path = food_item.image_url.replace('/media/', '', 1)
                        full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
                        
                        with open(full_path, 'rb') as f:
                            image_data = f.read()
                            image_filename = os.path.basename(full_path)
                            image_cid = f"food_image_{reservation.id}"
                            image_src = f"cid:{image_cid}"
                    except Exception as e:
                        print(f"Error reading local image for email: {e}")

            # HTML version
            image_html = ""
            if image_src:
                image_html = f'<div style="margin: 15px 0;"><img src="{image_src}" alt="{food_item.name}" style="max-width: 100%; width: 300px; height: auto; border-radius: 8px; object-fit: cover;"></div>'

            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2e7d32;">Reservation Confirmed! 🌱</h2>
                        <p>Hi <strong>{student.full_name or student.username}</strong>,</p>
                        <p>You have successfully reserved <strong>{quantity}x {food_item.name}</strong>.</p>
                        
                        {image_html}
                        
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>📍 Location:</strong> {food_item.location_name}</p>
                            <p style="margin: 5px 0;"><strong>💰 Price:</strong> {f"₹{food_item.price}" if food_item.price and food_item.price > 0 else "Free"}</p>
                            <p style="margin: 5px 0;"><strong>🏷️ Total:</strong> {total_price_str}</p>
                            <p style="margin: 5px 0;"><strong>⏰ Pickup by:</strong> {food_item.pickup_window_end}</p>
                        </div>
                        
                        <p>Please find your unique <strong>QR code attached</strong> to this email.</p>
                        <p>Show it to the canteen staff to collect your food.</p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #666;">Thank you for fighting food waste! 🌍<br>FoodLink Campus Team</p>
                    </div>
                </body>
            </html>
            """
            
            msg = EmailMultiAlternatives(
                subject,
                text_content,
                'noreply@foodlink.com',
                [student.email],
            )
            msg.attach_alternative(html_content, "text/html")

            # Attach local image if processed
            if image_data and image_cid:
                image = MIMEImage(image_data)
                image.add_header('Content-ID', f"<{image_cid}>")
                image.add_header('Content-Disposition', 'inline', filename=image_filename)
                msg.attach(image)


            # Generate QR Image
            qr_content = f"{reservation.qr_code_string}|{reservation.qr_signature}"
            img = qrcode.make(qr_content)
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            img_data = buffer.getvalue()
            
            # Attach QR Code
            msg.attach('qrcode.png', img_data, 'image/png')
            
            msg.send(fail_silently=False)
            
        except Exception as e:
            print(f"\n[EMAIL ERROR] Failed to send email: {e}\n")
        
        return reservation


class QRVerificationSerializer(serializers.Serializer):
    """Serializer for QR code verification"""
    qr_code_string = serializers.CharField()
    qr_signature = serializers.CharField()


class RouteSerializer(serializers.Serializer):
    """Serializer for charity routes"""
    id = serializers.CharField(read_only=True)
    charity = UserProfileSerializer(read_only=True)
    food_items = FoodItemListSerializer(many=True, read_only=True)
    food_item_ids = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    status = serializers.CharField(read_only=True)
    optimized_order = serializers.ListField(read_only=True)
    estimated_distance_km = serializers.CharField(read_only=True)
    estimated_duration_mins = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    started_at = serializers.DateTimeField(read_only=True)
    completed_at = serializers.DateTimeField(read_only=True)
    
    def create(self, validated_data):
        """Create route for charity"""
        food_item_ids = validated_data.pop('food_item_ids', [])
        charity = self.context.get('user')
        
        # Get escalated food items
        food_items = FoodItem.objects(
            id__in=food_item_ids,
            status='escalated'
        )
        
        route = Route(
            charity=charity,
            food_items=list(food_items),
        )
        route.save()
        return route


class NotificationSerializer(serializers.Serializer):
    """Serializer for notifications"""
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    message = serializers.CharField(read_only=True)
    notification_type = serializers.CharField(read_only=True)
    is_read = serializers.BooleanField()
    created_at = serializers.DateTimeField(read_only=True)
    food_item_id = serializers.CharField(read_only=True, source='food_item.id')


class LeaderboardSerializer(serializers.Serializer):
    """Serializer for leaderboard entries"""
    rank = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    sustainability_points = serializers.IntegerField()
    college_id = serializers.CharField()


class ImpactStatsSerializer(serializers.Serializer):
    """Serializer for impact statistics"""
    total_food_items_listed = serializers.IntegerField()
    total_food_items_collected = serializers.IntegerField()
    total_food_items_expired = serializers.IntegerField()
    total_kg_saved = serializers.FloatField()
    total_meals_redistributed = serializers.IntegerField()
    total_students_participated = serializers.IntegerField()
    total_charities_served = serializers.IntegerField()
    collection_rate_percent = serializers.FloatField()


class ChatMessageSerializer(serializers.Serializer):
    """Serializer for chatbot messages"""
    message = serializers.CharField()
    context = serializers.CharField(required=False, allow_blank=True)


class SupportMessageSerializer(serializers.Serializer):
    """Serializer for support messages"""
    id = serializers.CharField(read_only=True)
    sender = UserProfileSerializer(read_only=True)
    receiver = UserProfileSerializer(read_only=True)
    message = serializers.CharField(max_length=1000)
    is_read = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    def create(self, validated_data):
        user = self.context.get('user')
        # If admin is sending, they should specify receiver_id in context or url
        # For this simple implementation, we'll assume we are creating a message FROM the authenticated user
        
        # We need to know who the receiver is
        # If student/staff -> receiver is Admin
        # If Admin -> receiver is the specific user
        
        receiver_id = self.context.get('receiver_id')
        
        if user.role != 'admin':
            # Find an admin user (first one found)
            admin = User.objects(role='admin').first()
            if not admin:
                raise serializers.ValidationError("No admin available to receive message.")
            receiver = admin
        else:
             if not receiver_id:
                 raise serializers.ValidationError("Admin must specify receiver_id")
             receiver = User.objects.get(id=receiver_id)
             
        message = SupportMessage(
            sender=user,
            receiver=receiver,
            message=validated_data['message']
        )
        message.save()
        return message
