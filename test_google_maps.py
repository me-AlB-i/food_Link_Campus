
import os
import requests
from dotenv import load_dotenv

load_dotenv('.env')

api_key = os.getenv('GOOGLE_MAPS_API_KEY')
print(f"Key: {api_key[:5]}...")

if api_key:
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key={api_key}"
    try:
        response = requests.get(url)
        data = response.json()
        if data.get('status') == 'OK':
            print("GOOGLE MAPS: SUCCESS")
        else:
            print(f"GOOGLE MAPS: FAILED ({data.get('status')})")
            print(f"Reason: {data.get('error_message')}")
    except Exception as e:
        print(f"GOOGLE MAPS: ERROR {e}")
else:
    print("GOOGLE MAPS: NO KEY")
