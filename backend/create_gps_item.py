import os
import django
from datetime import datetime, timedelta
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodlink.settings')
django.setup()

from api.models import FoodItem, User, HygieneChecks

def create_gps_test_item():
    # 1. Get a Staff User
    staff = User.objects(role='staff').first()
    if not staff:
        staff = User(username='staff_gps_test', email='staff_gps@example.com', role='staff', is_approved=True)
        staff.set_password('pass')
        staff.save()

    # 2. Create Item with KERALA Coordinates (Oyur area)
    # Approx Lat/Long from user screenshot 
    # Center of screenshot map looks like: 8.922, 76.852? 
    # User's blue dot is near "Moonattimmukku Thodu".
    # I'll guess: 8.9213, 76.8485
    
    item = FoodItem(
        name="LOCAL KERALA TEST ITEM",
        description="This item is near your location in Oyur/Kottarakara. The Blue Route Line should appear!",
        quantity=3,
        unit="plates",
        food_type="veg",
        pickup_window_end=datetime.utcnow() - timedelta(hours=1),
        status="available",
        listed_by=staff,
        location_name="Near AKS Auditorium, Kerala",
        latitude="8.9213",
        longitude="76.8485", 
        price=0,
        hygiene_checks=HygieneChecks(temp_check=True, packaging_clean=True, safe_storage=True)
    )
    item.save()
    
    # 3. Escalate it
    item.mark_escalated()
    print(f"Created escalated item: {item.name} at {item.latitude}, {item.longitude}")

if __name__ == '__main__':
    create_gps_test_item()
