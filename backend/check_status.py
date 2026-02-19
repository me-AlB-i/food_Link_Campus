
import os
import sys
import django
from datetime import datetime

# Add current dir to path so we can import 'api'
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import FoodItem

def check_food_status():
    items = FoodItem.objects
    print(f"Total Food Items: {items.count()}")
    
    for item in items:
        # Check if expired
        is_expired = item.pickup_window_end < datetime.utcnow() if item.pickup_window_end else False
        status_str = f"[{'EXPIRED' if is_expired else 'active'}]"
        print(f"Item: {item.name}, Current Status: {item.status}, Pickup End: {item.pickup_window_end} {status_str}")

if __name__ == "__main__":
    check_food_status()
