"""Script to create demo users for FoodLink Campus"""
import os
import sys
import django
import hashlib

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodlink.settings')
django.setup()

from api.models import User

def hash_password(password):
    """Hash password using SHA256 (same as views.py login)"""
    return hashlib.sha256(password.encode()).hexdigest()

# Demo users to create
demo_users = [
    {'username': 'demo_student', 'email': 'student@demo.com', 'role': 'student', 'full_name': 'Demo Student'},
    {'username': 'demo_staff', 'email': 'staff@demo.com', 'role': 'staff', 'full_name': 'Demo Staff'},
    {'username': 'demo_charity', 'email': 'charity@demo.com', 'role': 'charity', 'full_name': 'Demo Charity', 'organization_name': 'Food For All NGO'},
    {'username': 'demo_admin', 'email': 'admin@demo.com', 'role': 'admin', 'full_name': 'Demo Admin'},
]

print("Creating demo users...")
password_hash = hash_password('demo123')
print(f"Password hash: {password_hash}")

for user_data in demo_users:
    try:
        existing = User.objects.filter(username=user_data['username']).first()
        if existing:
            # Update password hash for existing user
            existing.password_hash = password_hash
            existing.save()
            print(f"  Updated: {user_data['username']}")
        else:
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                role=user_data['role'],
                password_hash=password_hash,
                full_name=user_data.get('full_name', ''),
                organization_name=user_data.get('organization_name', ''),
                sustainability_points=0,
                is_active=True
            )
            user.save()
            print(f"  Created: {user_data['username']}")
    except Exception as e:
        print(f"  Error creating {user_data['username']}: {e}")

print("\nDone! You can now login with:")
print("  Username: demo_student, demo_staff, demo_charity, or demo_admin")
print("  Password: demo123")
