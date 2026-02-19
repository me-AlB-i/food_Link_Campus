
import os
from dotenv import load_dotenv
from google import genai

load_dotenv('.env')
api_key = os.getenv('GEMINI_API_KEY')

print(f"Testing Gemini Key: {api_key[:10]}...")

if api_key:
    client = genai.Client(api_key=api_key)
    try:
        # Testing 2.0-flash because it was found previously (even if quota exceeded)
        print("Model: gemini-2.0-flash")
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents='Hi'
        )
        print("SUCCESS! Output:", response.text)
    except Exception as e:
        print(f"FAILED (Expected if quota full): {e}")

else:
    print("No Key")
