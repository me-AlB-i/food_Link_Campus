
import os
from dotenv import load_dotenv

load_dotenv('.env')

maps_key = os.getenv('GOOGLE_MAPS_API_KEY')
gemini_key = os.getenv('GEMINI_API_KEY')

print(f"Current Google Maps Key in .env: {maps_key}")
print(f"Current Gemini Key in .env:      {gemini_key}")

if maps_key == "AIzaSyABoorGjAgT562v4ag1fu0Q17SqtsOpmy4":
    print("\n[!] This is the same Google Maps key as before. It is associated with a deleted project.")

if gemini_key == "AIzaSyA7R9qvCkpNulmI_1ODWgo_cUcW42AIS2s":
    print("\n[!] This is the same Gemini key as before. It is failing with 404 (Not Found).")
