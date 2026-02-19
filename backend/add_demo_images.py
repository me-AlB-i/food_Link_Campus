
import os
import random
import django
from mongoengine import connect

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodlink.settings')
django.setup()

from api.models import FoodItem

# Connect to MongoDB (ensure URI matches settings)
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/foodlink_campus')
connect(host=MONGODB_URI)

VEG_IMAGES = [
    "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?auto=format&fit=crop&w=500&q=80", # Indian Thali
    "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=500&q=80", # Biryani
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80", # Salad
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=500&q=80", # Stir fry
    "https://images.unsplash.com/photo-1505253758473-96b701d8fe62?auto=format&fit=crop&w=500&q=80", # Curry
]

NON_VEG_IMAGES = [
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=500&q=80", # Pancakes/Breakfast
    "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=500&q=80", # Meatballs
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=80", # Steak/Meal
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80", # Food bowl
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80", # BBQ
]

print("Adding demo images to food items...")

items = FoodItem.objects.all()
count = 0
for item in items:
    # Only update if no image
    if not item.image_url:
        if item.food_type == 'veg':
            item.image_url = random.choice(VEG_IMAGES)
        else:
            item.image_url = random.choice(NON_VEG_IMAGES)
        item.save()
        print(f"Updated {item.name}: {item.image_url}")
        count += 1

print(f"Done! Updated {count} items.")
