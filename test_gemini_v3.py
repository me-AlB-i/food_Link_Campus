
import os
import sys
from dotenv import load_dotenv

load_dotenv('.env')
api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("No GEMINI_API_KEY")
    sys.exit(0)

print(f"Testing Gemini Key: {api_key[:10]}...")

try:
    from google import genai
    client = genai.Client(api_key=api_key)
    
    print("Listing models:")
    try:
        # Simple iterator for google-genai
        for m in client.models.list():
            # Just print the name to avoid attribute errors
            print(f" - {m.name}")
    except Exception as e:
        print(f"List failed: {e}")

    print("\nGenerating (gemini-1.5-flash):")
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents='Hello'
        )
        print(f"SUCCESS: {response.text}")
    except Exception as e:
        print(f"FAILED: {e}")

except Exception as e:
    print(f"ERROR: {e}")
