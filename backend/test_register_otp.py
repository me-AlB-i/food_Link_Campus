
import requests
import json
import random
import string

BASE_URL = "http://localhost:8000/api/auth"

def test_register_otp_flow():
    print("Testing Registration OTP Flow...")
    
    # 1. Register with new user
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    username = f"test_user_{random_str}"
    email = f"test_{random_str}@example.com"
    
    register_data = {
        "username": username,
        "email": email,
        "password": "password123",
        "confirmPassword": "password123",
        "role": "student",
        "full_name": "Test User",
        "phone": "+919876543210"
    }
    
    print(f"Registering with {username}...")
    try:
        response = requests.post(f"{BASE_URL}/register/", json=register_data)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 201:
            data = response.json()
            if data.get('require_otp'):
                print("SUCCESS: Registration returned require_otp: True")
            else:
                print("FAILURE: Registration did NOT return require_otp: True")
        else:
             print("FAILURE: Registration failed")
             
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_register_otp_flow()
