
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

api_key = os.getenv('GEMINI_API_KEY')
print(f"Key: {api_key[:5]}...")

if api_key:
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        # Try gemini-1.5-flash which is usually default
        try:
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents='Hello'
            )
            print(f"GEMINI: SUCCESS (Response: {response.text[:20]}...)")
        except Exception as e:
            print(f"GEMINI: FAILED model call: {e}")
            
    except ImportError:
        print("GEMINI: FAILURE - google-genai not installed")
    except Exception as e:
        print(f"GEMINI: ERROR {e}")
else:
    print("GEMINI: NO KEY")
