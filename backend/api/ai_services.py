"""
FoodLink Campus - Google Gemini AI Integration
Handles NIYOM chat and Impact Report generation
"""
import os
from django.conf import settings

# System context for the Eco-Bot
ECOBOT_SYSTEM_CONTEXT = """
You are NIYOM, the helpful AI assistant for FoodLink Campus - a smart platform for managing and donating surplus food in college canteens.

About FoodLink Campus:
- Connects Canteen Staff (who list surplus food), Students (who reserve food), and Charities (who collect unclaimed bulk food)
- Goal: Minimize food waste by automating redistribution in real-time
- Students earn "Green Points" for rescuing food, displayed on a leaderboard

How to use FoodLink Campus:

FOR STUDENTS:
1. Log in with your college credentials
2. Browse available food in the Feed
3. Click "Reserve" on any item you want
4. Show your QR code to staff when picking up
5. Earn Green Points for each rescue!

FOR CANTEEN STAFF:
1. Log in with staff credentials
2. Fill out the food listing form (name, quantity, type)
3. Complete ALL hygiene checks (temperature, packaging, storage)
4. Submit to make food available to students
5. Scan student QR codes to verify pickups

FOR CHARITIES:
1. Register as a charity organization
2. View escalated food (unclaimed past pickup window)
3. Create optimized pickup routes
4. Collect food and mark as completed

CANTEEN HOURS: Usually 8 AM - 8 PM (check with specific campus)

Be helpful, concise, and encourage sustainable food practices. If you don't know something specific, suggest the user contact campus administration.
"""


def get_gemini_client():
    """
    Initialize and return Gemini client.
    Returns None if API key is not configured.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    
    if not api_key:
        return None
    
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        return client
    except ImportError:
        print("google-genai package not installed")
        return None
    except Exception as e:
        print(f"Error initializing Gemini: {e}")
        return None


def chat_with_niyom(user_message: str, additional_context: str = "") -> dict:
    """
    Send a message to NIYOM and get a response.
    Falls back to cached FAQ responses if Gemini is unavailable.
    
    Args:
        user_message: The user's question or message
        additional_context: Any additional context about the user
    
    Returns:
        dict with 'response' and 'source' keys
    """
    # Define tools for the model first (schema only)
    tool_schema = {
        "function_declarations": [
            {
                "name": "search_food",
                "description": "Search for available food items in the database based on a query.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "query": {
                            "type": "STRING",
                            "description": "The food item name or keyword to search for (e.g., 'biriyani', 'pizza')."
                        }
                    },
                    "required": ["query"]
                }
            }
        ]
    }

    client = get_gemini_client()
    
    if client:
        try:
            from google import genai
            from .models import FoodItem
            
            # 1. First turn: Send user message with tools
            # Note: The SDK might expect 'tools' as a list of Tool objects or dicts
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=f"{ECOBOT_SYSTEM_CONTEXT}\n\nAdditional Context: {additional_context}\n\nUser Question: {user_message}",
                config=genai.types.GenerateContentConfig(tools=[tool_schema])
            )

            # 2. Check for tool calls in the response candidates
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.function_call:
                        fc = part.function_call
                        if fc.name == "search_food":
                            query = fc.args["query"]
                            
                            # Perform search
                            from django.utils import timezone
                            import datetime
                            now = timezone.now()
                            
                            # Filter by name, availability, AND pickup window
                            # Note: MongoEngine uses __gt for greater than
                            items = FoodItem.objects(
                                name__icontains=query, 
                                status='available',
                                pickup_window_end__gt=now 
                            )
                            
                            if items:
                                food_list = "\n".join([f"- {item.name} ({item.quantity} {item.unit}) at {item.location_name} (Pickup until {item.pickup_window_end.strftime('%I:%M %p')})" for item in items])
                                tool_result = f"Found available items matching '{query}':\n{food_list}"
                            else:
                                tool_result = f"No available food items found matching '{query}'. Some items might be listed but have past their pickup time."

                            # 3. Second turn: Send tool result back
                            # Construct conversation history manually because chat session isn't persistent here
                            chat = client.chats.create(model='gemini-2.0-flash')
                            
                            # Manually sending the thought process + tool result is complex without chat history
                            # Easier: Just ask Gemini to answer based on this context
                            final_prompt = f"""
                            User asked: "{user_message}"
                            
                            You checked the database and found:
                            {tool_result}
                            
                            Please answer the user's question based on these findings.
                            """
                            
                            final_response = client.models.generate_content(
                                model='gemini-2.0-flash',
                                contents=final_prompt
                            )
                            
                            return {
                                'response': final_response.text,
                                'source': 'gemini_tool'
                            }

            # Normal text response
            return {
                'response': response.text,
                'source': 'gemini'
            }

        except Exception as e:
            print(f"Gemini API error: {e}")
    
    # Fallback
    return {
        'response': get_faq_response(user_message),
        'source': 'faq_cache'
    }


def get_faq_response(question: str) -> str:
    """
    Return cached FAQ response based on keywords.
    Used when Gemini API is unavailable.
    """
    question_lower = question.lower()
    
    faq_responses = {
        ('list', 'food', 'add'): 
            "To list food: Log in as Staff → Fill out the listing form with name, quantity, and type → Complete all hygiene checks → Submit. Your food will be immediately available to students.",
        
        ('reserve', 'book', 'get food'):
            "To reserve food: Log in as a Student → Browse available items in the Feed → Click 'Reserve' on your chosen item → Show your QR code to staff when picking up.",
        
        ('qr', 'code', 'scan'):
            "QR Code info: When you reserve food, you'll get a unique QR code. Show this to canteen staff when collecting your food. They'll scan it to verify and award you Green Points!",
        
        ('points', 'score', 'leaderboard'):
            "Green Points: You earn 10 points each time you rescue food. Check the Leaderboard to see top food rescuers on campus!",
        
        ('charity', 'donate', 'ngo'):
            "Charity pickups: If food isn't claimed before the pickup window ends, it's automatically escalated to registered charities who can create optimized pickup routes.",
        
        ('canteen', 'hours', 'open', 'time'):
            "Canteen hours vary by campus, but typically 8 AM - 8 PM. Check with your specific campus administration for exact timings.",
        
        ('hygiene', 'safety', 'check'):
            "Hygiene checks are mandatory for all food listings. Staff must verify: 1) Temperature check, 2) Clean packaging, 3) Safe storage. All three must pass before listing.",
        
        ('help', 'support', 'contact'):
            "For support, contact your campus FoodLink administrator. For technical issues, email support@foodlink.campus.",
    }
    
    for keywords, response in faq_responses.items():
        if any(keyword in question_lower for keyword in keywords):
            return response
    
    return "I'm sorry, I don't have a specific answer for that. Please try rephrasing your question, or contact campus administration for help. You can ask me about: listing food, reserving items, QR codes, Green Points, charity pickups, or canteen hours."

# Alias for backward compatibility with views.py
chat_with_ecobot = chat_with_niyom


def generate_impact_report(stats: dict) -> dict:
    """
    Generate an AI-written impact report from statistics.
    
    Args:
        stats: Dictionary containing impact statistics
    
    Returns:
        dict with 'report' (narrative text) and 'source' keys
    """
    client = get_gemini_client()
    
    if client:
        try:
            prompt = f"""
You are writing an impact report for FoodLink Campus, a college food redistribution platform.

Statistics:
- Total food items listed: {stats.get('total_food_items_listed', 0)}
- Food items successfully collected: {stats.get('total_food_items_collected', 0)}
- Food items expired/wasted: {stats.get('total_food_items_expired', 0)}
- Estimated kg of food saved: {stats.get('total_kg_saved', 0):.1f}
- Total meals redistributed: {stats.get('total_meals_redistributed', 0)}
- Students who participated: {stats.get('total_students_participated', 0)}
- Charities served: {stats.get('total_charities_served', 0)}
- Collection success rate: {stats.get('collection_rate_percent', 0):.1f}%

Write a 1-2 paragraph professional impact summary highlighting:
1. The environmental impact (food saved from waste)
2. Community benefit (meals provided, students engaged)
3. Success metrics compared to food waste problem

Keep it positive, data-driven, and inspiring. Use specific numbers from the stats.
"""
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            return {
                'report': response.text,
                'source': 'gemini'
            }
        except Exception as e:
            print(f"Gemini API error: {e}")
    
    # Fallback to template-based report
    return {
        'report': generate_template_report(stats),
        'source': 'template'
    }


def generate_template_report(stats: dict) -> str:
    """
    Generate a template-based impact report when AI is unavailable.
    """
    collected = stats.get('total_food_items_collected', 0)
    kg_saved = stats.get('total_kg_saved', 0)
    meals = stats.get('total_meals_redistributed', 0)
    students = stats.get('total_students_participated', 0)
    rate = stats.get('collection_rate_percent', 0)
    
    return f"""
FoodLink Campus Impact Report

Our campus community has made remarkable progress in fighting food waste. Through collective action, we have successfully redistributed {collected} food items, saving an estimated {kg_saved:.1f} kg of food from going to waste. This translates to approximately {meals} meals that reached people in need rather than landfills.

With {students} students actively participating and a collection success rate of {rate:.1f}%, we are building a culture of sustainability that extends beyond the cafeteria. Every meal saved represents not just food rescued, but reduced carbon emissions, conserved resources, and strengthened community bonds. Together, we are proving that small actions create meaningful change.
""".strip()
