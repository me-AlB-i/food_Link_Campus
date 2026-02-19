
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

api_key = os.getenv('GEMINI_API_KEY')
print(f"Testing Gemini Key: {api_key[:10]}..." if api_key else "No API Key found")

if not api_key:
    sys.exit(1)

try:
    from google import genai
    from google.genai import types
    
    print("google-genai library imported successfully.")
    
    client = genai.Client(api_key=api_key)
    
    # 1. Try to list models (good for debugging permissions)
    print("\nAttempting to list models...")
    try:
        # Pager object, need to iterate
        models_pager = client.models.list()
        count = 0
        for model in models_pager:
            if 'generateContent' in (model.supported_generation_methods or []):
                print(f" - {model.name}")
                count += 1
                if count >= 5: 
                    print(" ... (stopping list after 5)")
                    break
        if count == 0:
            print("No models found with generateContent support.")
            
    except Exception as e:
        print(f"List models failed: {e}")

    # 2. Try to generate content
    print("\nAttempting to generate content with 'gemini-1.5-flash'...")
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents='Hello, are you working?'
        )
        print(f"\nSUCCESS! Response: {response.text}")
    except Exception as e:
        print(f"\nGeneration failed: {e}")

except ImportError:
    print("CRITICAL: google-genai library not installed. Please run: pip install google-genai")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
