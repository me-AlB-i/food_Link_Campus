
import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import FoodItem

def check_food_status():
    items = FoodItem.objects()
    print(f"Total Food Items: {items.count()}")
    
    for item in items:
        print(f"Item: {item.name}, Status: {item.status}, Window End: {item.pickup_window_end}")

if __name__ == "__main__":
    check_food_status()
