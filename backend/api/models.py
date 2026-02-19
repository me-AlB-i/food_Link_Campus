from datetime import datetime
from mongoengine import (
    Document, EmbeddedDocument,
    StringField, IntField, DateTimeField, BooleanField,
    ReferenceField, EmbeddedDocumentField, ListField,
    EmailField, DecimalField
)
import hashlib
import hmac
import os
import uuid

# ... existing code ...

class User(Document):
    """
    User model supporting 4 roles: student, staff, charity, admin
    Uses MongoEngine for MongoDB storage
    """
    username = StringField(required=True, unique=True, max_length=50)
    email = EmailField(required=True, unique=True)
    password_hash = StringField(required=True)
    role = StringField(
        required=True,
        choices=['student', 'staff', 'charity', 'admin'],
        default='student'
    )
    college_id = StringField(max_length=20)  # e.g., UKP22CS001
    sustainability_points = IntField(default=0, min_value=0)
    full_name = StringField(max_length=100)
    
    # ... other fields ...
    phone = StringField(max_length=20)
    id_card_image_url = StringField(max_length=500) # Student ID Card for verification
    
    # Charity-specific fields
    organization_name = StringField(max_length=200)
    organization_address = StringField(max_length=500)
    
    # Staff-specific fields
    institution_type = StringField(choices=['School', 'Canteen'], default='Canteen')
    institution_name = StringField(max_length=200)
    is_approved = BooleanField(default=True) # Default True for non-staff, handled in View for staff
    
    # Auth providers
    google_id = StringField()

    # OTP Verification
    otp_code = StringField(max_length=6)
    otp_expires_at = DateTimeField()
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    last_login = DateTimeField()
    is_active = BooleanField(default=True)
    
    meta = {
        'collection': 'users',
        'indexes': [
            'username',
            'email',
            'role',
            'sustainability_points'
        ],
        'strict': False
    }
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    @property
    def is_authenticated(self):
        return True
    
    @property
    def is_anonymous(self):
        return False
    
    def add_points(self, points: int):
        self.sustainability_points = (self.sustainability_points or 0) + points
        self.save()
        return self.sustainability_points


class HygieneChecks(EmbeddedDocument):
    temp_check = BooleanField(default=False, description="Temperature verified")
    packaging_clean = BooleanField(default=False, description="Packaging is clean and intact")
    safe_storage = BooleanField(default=False, description="Food stored safely")
    
    def is_valid(self) -> bool:
        return all([self.temp_check, self.packaging_clean, self.safe_storage])


class FoodItem(Document):
    # ... existing code ...
    name = StringField(required=True, max_length=100)
    description = StringField(max_length=500)
    quantity = IntField(required=True, min_value=1)
    unit = StringField(choices=['plates', 'kg', 'liters', 'pieces'], default='plates')
    food_type = StringField(
        required=True,
        choices=['veg', 'non-veg'],
        default='veg'
    )
    status = StringField(
        required=True,
        choices=['available', 'reserved', 'collected', 'escalated', 'expired'],
        default='available'
    )
    
    # Time constraints
    pickup_window_start = DateTimeField(default=datetime.utcnow)
    pickup_window_end = DateTimeField(required=True)
    
    # Safety compliance
    hygiene_checks = EmbeddedDocumentField(HygieneChecks, required=True)
    
    # Relationships
    listed_by = ReferenceField(User, required=True)
    collected_by = ReferenceField(User)  # Student or Charity who collected
    
    # Location (for charity routing)
    location_name = StringField(max_length=200)  # e.g., "Main Canteen"
    latitude = StringField()
    longitude = StringField()
    
    # Timestamps
    listed_at = DateTimeField(default=datetime.utcnow)
    reserved_at = DateTimeField()
    collected_at = DateTimeField()
    escalated_at = DateTimeField()
    
    # Image (optional)
    image_url = StringField(max_length=500)

    # Price (optional, default 0.0)
    price = DecimalField(precision=2, min_value=0, default=0.0) # Offer Price
    retail_price = DecimalField(precision=2, min_value=0, default=0.0) # Original Retail Price
    
    meta = {
        'collection': 'food_items',
        'indexes': [
            'status',
            'food_type',
            'pickup_window_end',
            'listed_at',
            ('status', 'pickup_window_end'),  # Compound index for escalation query
        ],
        'ordering': ['-listed_at']
    }
    
    def __str__(self):
        return f"{self.name} ({self.status})"
    
    def can_be_reserved(self) -> bool:
        now = datetime.utcnow()
        pickup_end = self.pickup_window_end
        if pickup_end.tzinfo is not None:
            pickup_end = pickup_end.replace(tzinfo=None)
        
        return (
            self.status == 'available' and 
            pickup_end > now
        )
    
    def mark_reserved(self):
        self.status = 'reserved'
        self.reserved_at = datetime.utcnow()
        self.save()
    
    def mark_collected(self, collected_by_user: User):
        self.status = 'collected'
        self.collected_by = collected_by_user
        self.collected_at = datetime.utcnow()
        self.save()
    
    def mark_escalated(self):
        self.status = 'escalated'
        self.escalated_at = datetime.utcnow()
        self.save()
    
    def mark_expired(self):
        self.status = 'expired'
        self.save()


class Reservation(Document):
    food_item = ReferenceField(FoodItem, required=True)
    student = ReferenceField(User, required=True)
    
    # QR Code - HMAC signed for security
    qr_code_string = StringField(unique=True, max_length=200)
    qr_signature = StringField(max_length=64)  # HMAC signature
    
    status = StringField(
        choices=['active', 'collected', 'expired', 'cancelled'],
        default='active'
    )
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    collected_at = DateTimeField()
    
    # Points awarded
    points_awarded = IntField(default=0)
    
    meta = {
        'collection': 'reservations',
        'indexes': [
            'qr_code_string',
            'status',
            ('student', 'status'),
            ('food_item', 'status'),
        ]
    }
    
    def __str__(self):
        return f"Reservation: {self.student.username} -> {self.food_item.name}"
    
    def generate_qr_code(self):
        unique_id = f"{self.id}-{uuid.uuid4().hex[:8]}"
        self.qr_code_string = f"FOODLINK-{unique_id}"
        
        secret = os.getenv('JWT_SECRET_KEY', 'default-secret').encode()
        signature = hmac.new(
            secret,
            self.qr_code_string.encode(),
            hashlib.sha256
        ).hexdigest()
        self.qr_signature = signature
        
        self.save()
        return self.qr_code_string
    
    @staticmethod
    def verify_qr_signature(qr_string: str, signature: str) -> bool:
        secret = os.getenv('JWT_SECRET_KEY', 'default-secret').encode()
        expected_signature = hmac.new(
            secret,
            qr_string.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, signature)
    
    def mark_collected(self, points: int = 10):
        self.status = 'collected'
        self.collected_at = datetime.utcnow()
        self.points_awarded = points
        self.save()
        
        self.student.add_points(points)
        self.food_item.mark_collected(self.student)
        
        return points


class Route(Document):
    charity = ReferenceField(User, required=True)
    food_items = ListField(ReferenceField(FoodItem))
    
    status = StringField(
        choices=['planned', 'in_progress', 'completed'],
        default='planned'
    )
    
    # Route optimization
    optimized_order = ListField(StringField())  # List of FoodItem IDs in optimal order
    estimated_distance_km = StringField()
    estimated_duration_mins = IntField()
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    started_at = DateTimeField()
    completed_at = DateTimeField()
    
    meta = {
        'collection': 'routes',
        'indexes': [
            'charity',
            'status',
            'created_at',
        ]
    }
    
    def __str__(self):
        return f"Route for {self.charity.organization_name or self.charity.username}"
    
    def start_route(self):
        self.status = 'in_progress'
        self.started_at = datetime.utcnow()
        self.save()
    
    def complete_route(self):
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
        self.save()
        
        for item in self.food_items:
            if item.status == 'escalated':
                item.mark_collected(self.charity)


class Notification(Document):
    recipient = ReferenceField(User, required=True)
    title = StringField(required=True, max_length=100)
    message = StringField(required=True, max_length=500)
    notification_type = StringField(
        choices=['new_food', 'reservation', 'escalation', 'points', 'system', 'support'],
        default='system'
    )
    
    # Related entities
    food_item = ReferenceField(FoodItem)
    reservation = ReferenceField(Reservation)
    
    # Status
    is_read = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'notifications',
        'indexes': [
            ('recipient', 'is_read'),
            'created_at',
        ],
        'ordering': ['-created_at']
    }


class SupportMessage(Document):
    """
    Message for customer service support chat
    """
    sender = ReferenceField(User, required=True)
    receiver = ReferenceField(User, required=True)
    message = StringField(required=True, max_length=1000)
    is_read = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'support_messages',
        'indexes': [
            'sender',
            'receiver',
            'created_at',
            ('sender', 'receiver'),
        ],
        'ordering': ['created_at']
    }
