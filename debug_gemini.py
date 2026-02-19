
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv('.env')
api_key = os.getenv('GEMINI_API_KEY', '').strip()
print(f"Gemini Key: '{api_key}'")

if not api_key:
    print("Error: No key found")
    exit()

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hi")
    print(f"GEMINI SUCCESS: {response.text}")
except Exception as e:
    print(f"GEMINI FAILED: {e}")
