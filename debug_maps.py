
import os
import requests
from dotenv import load_dotenv

load_dotenv('.env')

# Force strip whitespace just in case
api_key = os.getenv('GOOGLE_MAPS_API_KEY', '').strip()
print(f"Maps Key: '{api_key}'")

if not api_key:
    print("Error: No key found")
    exit()

url = f"https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key={api_key}"
try:
    resp = requests.get(url)
    data = resp.json()
    if data.get('status') == 'OK':
        print("MAPS SUCCESS")
    else:
        print(f"MAPS FAILED: {data.get('status')}")
        print(f"Message: {data.get('error_message')}")
except Exception as e:
    print(f"MAPS ERROR: {e}")
