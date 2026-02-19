"""Test script to verify Gemini API connection with different models"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

api_key = os.getenv('GEMINI_API_KEY', '')

result = []
result.append(f"API Key configured: {'Yes' if api_key else 'No'}")
result.append(f"API Key (first 10 chars): {api_key[:10]}..." if api_key else "No key found")

if api_key:
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        # Try different models
        models_to_try = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']
        
        for model in models_to_try:
            result.append(f"\nTesting model: {model}...")
            try:
                response = client.models.generate_content(
                    model=model,
                    contents='Say "Hello!" only.'
                )
                result.append(f"SUCCESS with {model}! Response: {response.text}")
                break
            except Exception as e:
                result.append(f"Failed with {model}: {str(e)[:100]}...")
        
    except ImportError as e:
        result.append(f"ERROR: google-genai package not installed")
    except Exception as e:
        result.append(f"ERROR: {type(e).__name__}: {e}")
else:
    result.append("ERROR: No GEMINI_API_KEY found in .env file")

# Write to file
with open('gemini_test_result.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(result))

print("Result written to gemini_test_result.txt")
