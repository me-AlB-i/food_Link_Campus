
import os
import sys
from dotenv import load_dotenv
from google import genai

load_dotenv('.env')
api_key = os.getenv('GEMINI_API_KEY')

print(f"Testing Gemini Key: {api_key[:10]}...")

try:
    client = genai.Client(api_key=api_key)
    print("Attempting to generate with 'gemini-2.0-flash'...")
    
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents='Hello, say "Working!"'
    )
    print(f"SUCCESS: {response.text}")
    
except Exception as e:
    print(f"FAILED: {e}")
