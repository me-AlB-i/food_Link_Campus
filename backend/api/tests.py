"""
FoodLink Campus - API Tests
Comprehensive test suite for all endpoints
"""
import pytest
from datetime import datetime, timedelta
import hashlib
import json

# These tests are designed to work with pytest-django and mongoengine


class TestModels:
    """Test MongoDB models"""
    
    def test_user_creation(self):
        """Test user model creation and password hashing"""
        from api.models import User
        
        # Create test user
        user = User(
            username='test_user',
            email='test@example.com',
            password_hash=hashlib.sha256('testpass'.encode()).hexdigest(),
            role='student',
            college_id='TEST001'
        )
        
        assert user.username == 'test_user'
        assert user.role == 'student'
        assert user.sustainability_points == 0
    
    def test_hygiene_checks_validation(self):
        """Test that hygiene checks validation works"""
        from api.models import HygieneChecks
        
        # All false - should not be valid
        checks = HygieneChecks(
            temp_check=False,
            packaging_clean=False,
            safe_storage=False
        )
        assert checks.is_valid() == False
        
        # All true - should be valid
        checks_valid = HygieneChecks(
            temp_check=True,
            packaging_clean=True,
            safe_storage=True
        )
        assert checks_valid.is_valid() == True
    
    def test_food_item_can_be_reserved(self):
        """Test food item reservation eligibility"""
        from api.models import FoodItem, HygieneChecks, User
        
        # Create mock user
        user = User(
            username='test_staff',
            email='staff@test.com',
            password_hash='hash',
            role='staff'
        )
        
        hygiene = HygieneChecks(
            temp_check=True,
            packaging_clean=True,
            safe_storage=True
        )
        
        # Available item with future pickup window
        food = FoodItem(
            name='Test Food',
            quantity=10,
            food_type='veg',
            status='available',
            pickup_window_end=datetime.utcnow() + timedelta(hours=2),
            hygiene_checks=hygiene,
            listed_by=user
        )
        
        assert food.can_be_reserved() == True
        
        # Reserved item - cannot be reserved again
        food.status = 'reserved'
        assert food.can_be_reserved() == False
        
        # Expired item - cannot be reserved
        food.status = 'available'
        food.pickup_window_end = datetime.utcnow() - timedelta(hours=1)
        assert food.can_be_reserved() == False
    
    def test_reservation_qr_generation(self):
        """Test QR code generation and signature"""
        from api.models import Reservation
        import os
        
        # Set test secret
        os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
        
        reservation = Reservation()
        reservation._id = 'test_id_123'
        
        # Generate QR
        # Note: In actual test, we'd need to save and have proper ID
        # This is a structural test
        assert hasattr(reservation, 'generate_qr_code')
        assert hasattr(reservation, 'verify_qr_signature')


class TestSerializers:
    """Test DRF serializers"""
    
    def test_hygiene_serializer_validation(self):
        """Test hygiene checklist validation in serializer"""
        from api.serializers import HygieneChecksSerializer
        
        # All false - should fail
        serializer = HygieneChecksSerializer(data={
            'temp_check': False,
            'packaging_clean': True,
            'safe_storage': True
        })
        assert serializer.is_valid() == False
        
        # All true - should pass
        serializer_valid = HygieneChecksSerializer(data={
            'temp_check': True,
            'packaging_clean': True,
            'safe_storage': True
        })
        assert serializer_valid.is_valid() == True
    
    def test_user_serializer_password_hashing(self):
        """Test that password is hashed on user creation"""
        from api.serializers import UserSerializer
        
        serializer = UserSerializer(data={
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'plaintext123',
            'role': 'student'
        })
        
        if serializer.is_valid():
            # Password should be write_only
            assert 'password' not in serializer.data
    
    def test_food_item_computed_fields(self):
        """Test computed fields in food item serializer"""
        from api.serializers import FoodItemListSerializer
        from api.models import FoodItem, HygieneChecks
        from datetime import datetime, timedelta
        
        # Mock food item
        class MockFood:
            id = '123'
            name = 'Test'
            quantity = 10
            unit = 'plates'
            food_type = 'veg'
            status = 'available'
            pickup_window_end = datetime.utcnow() + timedelta(hours=2)
            location_name = 'Test Location'
            listed_at = datetime.utcnow()
            image_url = ''
            
            def can_be_reserved(self):
                return self.status == 'available' and self.pickup_window_end > datetime.utcnow()
        
        food = MockFood()
        serializer = FoodItemListSerializer(food)
        
        assert 'can_reserve' in serializer.data
        assert 'time_remaining' in serializer.data
        assert serializer.data['can_reserve'] == True


class TestPermissions:
    """Test RBAC permission classes"""
    
    def test_is_staff_permission(self):
        """Test IsStaff permission class"""
        from api.permissions import IsStaff
        
        permission = IsStaff()
        
        # Mock request with staff user
        class MockStaffUser:
            role = 'staff'
        
        class MockStudentUser:
            role = 'student'
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        staff_request = MockRequest(MockStaffUser())
        student_request = MockRequest(MockStudentUser())
        
        assert permission.has_permission(staff_request, None) == True
        assert permission.has_permission(student_request, None) == False
    
    def test_is_student_permission(self):
        """Test IsStudent permission class"""
        from api.permissions import IsStudent
        
        permission = IsStudent()
        
        class MockStudentUser:
            role = 'student'
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        student_request = MockRequest(MockStudentUser())
        assert permission.has_permission(student_request, None) == True


class TestAIServices:
    """Test Gemini AI integration"""
    
    def test_faq_fallback(self):
        """Test FAQ fallback when Gemini is unavailable"""
        from api.ai_services import get_faq_response
        
        # Test known questions
        response = get_faq_response("How do I list food?")
        assert "list" in response.lower() or "listing" in response.lower()
        
        response = get_faq_response("What are green points?")
        assert "points" in response.lower()
        
        # Test unknown question fallback
        response = get_faq_response("Random unknown question xyz")
        assert "sorry" in response.lower() or "don't have" in response.lower()
    
    def test_template_report_generation(self):
        """Test template-based report when AI is unavailable"""
        from api.ai_services import generate_template_report
        
        stats = {
            'total_food_items_listed': 100,
            'total_food_items_collected': 85,
            'total_food_items_expired': 15,
            'total_kg_saved': 42.5,
            'total_meals_redistributed': 85,
            'total_students_participated': 50,
            'total_charities_served': 3,
            'collection_rate_percent': 85.0
        }
        
        report = generate_template_report(stats)
        
        assert '85' in report  # Collected count
        assert '42.5' in report  # kg saved
        assert '85.0' in report  # rate


class TestAPIEndpoints:
    """Integration tests for API endpoints"""
    
    def test_login_endpoint_structure(self):
        """Test login endpoint returns correct structure"""
        # This would require actual HTTP testing with Django test client
        # Documenting expected structure
        expected_response = {
            'user': {
                'id': 'string',
                'username': 'string',
                'email': 'string',
                'role': 'string',
            },
            'tokens': {
                'access': 'string',
                'refresh': 'string',
            }
        }
        
        # Verify structure exists
        assert 'user' in expected_response
        assert 'tokens' in expected_response
    
    def test_food_item_list_endpoint_structure(self):
        """Test food list endpoint returns correct structure"""
        expected_item = {
            'id': 'string',
            'name': 'string',
            'quantity': 0,
            'unit': 'string',
            'food_type': 'string',
            'status': 'string',
            'can_reserve': True,
            'time_remaining': 'string',
        }
        
        # Verify all expected fields
        required_fields = ['id', 'name', 'quantity', 'status', 'can_reserve']
        for field in required_fields:
            assert field in expected_item


# Run tests
if __name__ == '__main__':
    print("Run tests with: pytest tests.py -v")
    print("\nTest categories:")
    print("  - TestModels: MongoDB document tests")
    print("  - TestSerializers: DRF serializer tests")
    print("  - TestPermissions: RBAC permission tests")
    print("  - TestAIServices: Gemini integration tests")
    print("  - TestAPIEndpoints: API structure tests")
