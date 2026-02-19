
import os
import sys
import django
from datetime import datetime, timedelta
import random

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodlink.settings')
django.setup()

from api.models import User, FoodItem, HygieneChecks

def seed_food():
    print("Seeding food items...")
    
    staff = User.objects(role='staff').first()
    if not staff:
        print("No staff user found! Run seed_users.py first.")
        return

    # Clear existing? No, just add if empty
    if FoodItem.objects.count() > 0:
        print(f"Found {FoodItem.objects.count()} existing items. Skipping creation.")
        return

    commands = [
        {
            "name": "Veg Thali Deluxe", 
            "type": "veg", 
            "qty": 10,
            "unit": "plates",
            "img": "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=500&q=80"
        },
        {
            "name": "Chicken Biryani", 
            "type": "non-veg", 
            "qty": 5,
            "unit": "plates",
            "img": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=500&q=80"
        },
        {
            "name": "Paneer Butter Masala", 
            "type": "veg", 
            "qty": 8,
            "unit": "plates",
            "img": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"
        }
    ]

    for item in commands:
        food = FoodItem(
            name=item['name'],
            description="Delicious campus food looking for a home!",
            quantity=item['qty'],
            unit=item['unit'],
            food_type=item['type'],
            status='available',
            pickup_window_end=datetime.utcnow() + timedelta(hours=4),
            hygiene_checks=HygieneChecks(
                temp_check=True,
                packaging_clean=True,
                safe_storage=True
            ),
            listed_by=staff,
            location_name="Main Cafeteria",
            image_url=item['img']
        )
        food.save()
        print(f"Created: {food.name}")

if __name__ == "__main__":
    seed_food()
