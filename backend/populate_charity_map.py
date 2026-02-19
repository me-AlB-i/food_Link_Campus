
import os
import sys
import django
from datetime import datetime, timedelta
import random

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodlink.settings')
django.setup()

from api.models import User, FoodItem, HygieneChecks

def create_test_data():
    print("Creating test data for Charity Dashboard...")
    
    # 1. Get or Create Staff User (to list the food)
    staff_user = User.objects(role='staff').first()
    if not staff_user:
        print("No staff user found. Creating 'test_staff'...")
        staff_user = User(
            username='test_staff',
            email='staff@test.com',
            password_hash='hashed_secret', # Dummy hash
            role='staff',
            full_name='Test Staff Member',
            is_approved=True,
            institution_name='Main Campus Canteen'
        )
        staff_user.save()
    else:
        print(f"Using existing staff user: {staff_user.username}")

    # 2. Create Escalated Food Items
    # These should appear on the map immediately
    locations = [
        {"name": "Main Canteen", "lat": "12.9716", "lng": "77.5946"},
        {"name": "North Block Cafe", "lat": "12.9780", "lng": "77.5900"},
        {"name": "Sports Complex", "lat": "12.9650", "lng": "77.6000"},
    ]
    
    foods = [
        ("Excess Rice & Curry", 50, "plates"),
        ("Sandwich Platter", 20, "pieces"),
        ("Fruit Salad", 15, "kg"),
        ("Veg Biryani", 35, "plates")
    ]
    
    created_count = 0
    
    for i in range(5):
        loc = random.choice(locations)
        food_info = random.choice(foods)
        
        # Create item with status='escalated' (simulating expiration)
        item = FoodItem(
            name=f"{food_info[0]} #{i+1}",
            description="Fresh surplus food, ready for pickup",
            quantity=food_info[1],
            unit=food_info[2],
            food_type='veg',
            # Key: Status is ESCALATED
            status='escalated', 
            # Key: Window ended in the past
            pickup_window_end=datetime.utcnow() - timedelta(hours=2),
            hygiene_checks=HygieneChecks(temp_check=True, packaging_clean=True, safe_storage=True),
            listed_by=staff_user,
            location_name=loc["name"],
            latitude=loc["lat"],
            longitude=loc["lng"],
            listed_at=datetime.utcnow() - timedelta(hours=5),
            escalated_at=datetime.utcnow() - timedelta(hours=1),
            image_url="/media/food_images/placeholder.jpg"
        )
        item.save()
        created_count += 1
        print(f"Created escalated item: {item.name} at {loc['name']}")

    print(f"\nSuccessfully created {created_count} escalated food items!")
    print("Refresh your Charity Dashboard to see them on the map.")

if __name__ == "__main__":
    create_test_data()
