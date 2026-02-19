
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv('.env')
api_key = os.getenv('GEMINI_API_KEY', '').strip()
print(f"KeyLength: {len(api_key)}")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hi")
    print(f"SUCCESS")
except Exception as e:
    err = str(e)
    # Print only first 200 chars to fit in buffer
    print(f"ERROR: {err[:200]}")
