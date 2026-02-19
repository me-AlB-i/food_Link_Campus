"""
FoodLink Campus - Django Project Initialization
Establishes MongoDB connection via MongoEngine
"""
import os
from mongoengine import connect, disconnect
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')

# Connect to MongoDB
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/foodlink_campus')

try:
    # Disconnect any existing connections first
    disconnect(alias='default')
except Exception:
    pass

# Establish new connection
connect(host=MONGODB_URI, alias='default')
