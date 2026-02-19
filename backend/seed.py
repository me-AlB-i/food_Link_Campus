"""
FoodLink Campus - Database Seed Script
Creates demo users and sample food items for testing
"""
import os
import sys
from datetime import datetime, timedelta
import hashlib

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodlink.settings')

# Initialize Django and MongoDB connection
import django
django.setup()

from api.models import User, FoodItem, HygieneChecks, Reservation, Notification


def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def create_demo_users():
    """Create demo users for each role"""
    print("Creating demo users...")
    
    demo_users = [
        {
            'username': 'demo_student',
            'email': 'student@foodlink.campus',
            'password_hash': hash_password('demo123'),
            'role': 'student',
            'full_name': 'Demo Student',
            'college_id': 'UKP22CS001',
            'sustainability_points': 150,
        },
        {
            'username': 'demo_staff',
            'email': 'staff@foodlink.campus',
            'password_hash': hash_password('demo123'),
            'role': 'staff',
            'full_name': 'Demo Staff',
            'college_id': 'STAFF001',
        },
        {
            'username': 'demo_charity',
            'email': 'charity@foodlink.campus',
            'password_hash': hash_password('demo123'),
            'role': 'charity',
            'full_name': 'Food Bank Volunteer',
            'organization_name': 'Campus Food Bank',
            'organization_address': '123 University Road',
        },
        {
            'username': 'demo_admin',
            'email': 'admin@foodlink.campus',
            'password_hash': hash_password('demo123'),
            'role': 'admin',
            'full_name': 'System Admin',
        },
        # Additional students for leaderboard
        {
            'username': 'green_champion',
            'email': 'champion@campus.edu',
            'password_hash': hash_password('demo123'),
            'role': 'student',
            'full_name': 'Green Champion',
            'college_id': 'UKP21CS015',
            'sustainability_points': 320,
        },
        {
            'username': 'eco_warrior',
            'email': 'warrior@campus.edu',
            'password_hash': hash_password('demo123'),
            'role': 'student',
            'full_name': 'Eco Warrior',
            'college_id': 'UKP22ME008',
            'sustainability_points': 280,
        },
        {
            'username': 'food_saver',
            'email': 'saver@campus.edu',
            'password_hash': hash_password('demo123'),
            'role': 'student',
            'full_name': 'Food Saver',
            'college_id': 'UKP23EC042',
            'sustainability_points': 190,
        },
    ]
    
    created_users = {}
    for user_data in demo_users:
        try:
            # Check if user exists
            existing = User.objects(username=user_data['username']).first()
            if existing:
                print(f"  ⚠ User '{user_data['username']}' already exists, skipping...")
                created_users[user_data['username']] = existing
                continue
            
            user = User(**user_data)
            user.save()
            print(f"  ✓ Created user: {user_data['username']} ({user_data['role']})")
            created_users[user_data['username']] = user
            
        except Exception as e:
            print(f"  ✗ Failed to create {user_data['username']}: {str(e)}")
    
    return created_users


def create_sample_food_items(staff_user):
    """Create sample food items"""
    print("\nCreating sample food items...")
    
    food_items = [
        {
            'name': 'Vegetable Biryani',
            'description': 'Fragrant basmati rice with mixed vegetables and aromatic spices',
            'quantity': 15,
            'unit': 'plates',
            'food_type': 'veg',
            'status': 'available',
            'pickup_window_end': datetime.utcnow() + timedelta(hours=3),
            'location_name': 'Main Canteen',
        },
        {
            'name': 'Paneer Butter Masala',
            'description': 'Creamy tomato-based curry with cottage cheese cubes',
            'quantity': 10,
            'unit': 'plates',
            'food_type': 'veg',
            'status': 'available',
            'pickup_window_end': datetime.utcnow() + timedelta(hours=2),
            'location_name': 'Main Canteen',
        },
        {
            'name': 'Chicken Curry',
            'description': 'Traditional Indian chicken curry with rich gravy',
            'quantity': 8,
            'unit': 'plates',
            'food_type': 'non-veg',
            'status': 'available',
            'pickup_window_end': datetime.utcnow() + timedelta(hours=2),
            'location_name': 'Non-Veg Counter',
        },
        {
            'name': 'Dal Tadka',
            'description': 'Yellow lentils tempered with cumin and garlic',
            'quantity': 20,
            'unit': 'plates',
            'food_type': 'veg',
            'status': 'available',
            'pickup_window_end': datetime.utcnow() + timedelta(hours=4),
            'location_name': 'Main Canteen',
        },
        {
            'name': 'Mixed Fruit Salad',
            'description': 'Fresh seasonal fruits with honey dressing',
            'quantity': 12,
            'unit': 'plates',
            'food_type': 'veg',
            'status': 'available',
            'pickup_window_end': datetime.utcnow() + timedelta(hours=1),
            'location_name': 'Juice Bar',
        },
        {
            'name': 'Leftover Rice',
            'description': 'Steamed basmati rice - ideal for fried rice',
            'quantity': 5,
            'unit': 'kg',
            'food_type': 'veg',
            'status': 'escalated',
            'pickup_window_end': datetime.utcnow() - timedelta(hours=1),
            'escalated_at': datetime.utcnow(),
            'location_name': 'Main Canteen Kitchen',
        },
        {
            'name': 'Bread Rolls',
            'description': 'Fresh baked bread rolls from breakfast',
            'quantity': 25,
            'unit': 'pieces',
            'food_type': 'veg',
            'status': 'escalated',
            'pickup_window_end': datetime.utcnow() - timedelta(hours=2),
            'escalated_at': datetime.utcnow(),
            'location_name': 'Bakery Section',
        },
    ]
    
    created_items = []
    for item_data in food_items:
        try:
            # Create hygiene checks (all passed)
            hygiene = HygieneChecks(
                temp_check=True,
                packaging_clean=True,
                safe_storage=True
            )
            
            food_item = FoodItem(
                hygiene_checks=hygiene,
                listed_by=staff_user,
                listed_at=datetime.utcnow() - timedelta(hours=1),
                **item_data
            )
            food_item.save()
            print(f"  ✓ Created food: {item_data['name']} ({item_data['status']})")
            created_items.append(food_item)
            
        except Exception as e:
            print(f"  ✗ Failed to create {item_data['name']}: {str(e)}")
    
    return created_items


def create_sample_notifications(users):
    """Create sample notifications"""
    print("\nCreating sample notifications...")
    
    notifications = [
        {
            'recipient': users.get('demo_student'),
            'title': 'Welcome to FoodLink Campus! 🌱',
            'message': 'Start rescuing food today and earn Green Points!',
            'notification_type': 'system',
        },
        {
            'recipient': users.get('demo_charity'),
            'title': 'New Escalated Food Available',
            'message': '2 items are ready for pickup at Main Canteen',
            'notification_type': 'escalation',
        },
    ]
    
    for notif_data in notifications:
        if notif_data['recipient']:
            try:
                notif = Notification(**notif_data)
                notif.save()
                print(f"  ✓ Created notification for: {notif_data['recipient'].username}")
            except Exception as e:
                print(f"  ✗ Failed: {str(e)}")


def clear_database():
    """Clear all data (use with caution!)"""
    print("⚠ Clearing existing data...")
    Notification.objects.delete()
    Reservation.objects.delete()
    FoodItem.objects.delete()
    # Don't delete users to preserve any real accounts
    print("  ✓ Cleared food items, reservations, and notifications")


def run_seed(clear_first=False):
    """Main seed function"""
    print("=" * 50)
    print("FoodLink Campus - Database Seeder")
    print("=" * 50)
    
    if clear_first:
        clear_database()
    
    # Create users
    users = create_demo_users()
    
    # Create food items (using staff user)
    staff_user = users.get('demo_staff')
    if staff_user:
        create_sample_food_items(staff_user)
    
    # Create notifications
    create_sample_notifications(users)
    
    print("\n" + "=" * 50)
    print("✓ Seeding complete!")
    print("=" * 50)
    print("\nDemo Credentials:")
    print("  Student: demo_student / demo123")
    print("  Staff:   demo_staff / demo123")
    print("  Charity: demo_charity / demo123")
    print("  Admin:   demo_admin / demo123")


if __name__ == '__main__':
    # Check for --clear flag
    clear_first = '--clear' in sys.argv
    run_seed(clear_first)
