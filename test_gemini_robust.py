
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv('.env')
api_key = os.getenv('GEMINI_API_KEY')
print(f"Gemini Key: {api_key[:10]}..." if api_key else "Gemini Key: NOT FOUND")

if api_key:
    genai.configure(api_key=api_key)
    # List of models to try
    models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro']
    
    success = False
    for model_name in models:
        print(f"\nTesting model: {model_name}...")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Say 'Hello'")
            print(f"SUCCESS with {model_name}!")
            print(f"Response: {response.text}")
            success = True
            break
        except Exception as e:
            print(f"Failed with {model_name}: {e}")
            
    if not success:
        print("\nAll Gemini model tests failed.")
else:
    print("Please set GEMINI_API_KEY in .env")
