
import os
import requests
from dotenv import load_dotenv

load_dotenv('.env')

api_key = os.getenv('GOOGLE_MAPS_API_KEY')
print(f"Google Maps Key: {api_key[:10]}..." if api_key else "Google Maps Key: NOT FOUND")

if api_key:
    # Test Geocoding API (simplest to test)
    # Note: This requires the 'Geocoding API' to be enabled in Google Cloud Console
    address = "1600 Amphitheatre Parkway, Mountain View, CA"
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={api_key}"
    
    print(f"\nTesting Geocoding API...")
    try:
        response = requests.get(url)
        data = response.json()
        
        status = data.get('status')
        if status == 'OK':
            print("SUCCESS: Google Maps API is working!")
            location = data['results'][0]['geometry']['location']
            print(f"Coordinates: {location}")
        else:
            print(f"FAILED: API returned status '{status}'")
            print(f"Error Message: {data.get('error_message', 'No error message')}")
            
    except Exception as e:
        print(f"ERROR making request: {e}")
else:
    print("Please set GOOGLE_MAPS_API_KEY in .env")
