
import pymongo
import os
from dotenv import load_dotenv

load_dotenv()

client = pymongo.MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017/foodlink_db'))
db = client.get_database()

escalated_count = db.food_items.count_documents({'status': 'escalated'})
available_count = db.food_items.count_documents({'status': 'available'})
total_count = db.food_items.count_documents({})

print(f"Total: {total_count}")
print(f"Available: {available_count}")
print(f"Escalated: {escalated_count}")
