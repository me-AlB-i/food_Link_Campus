
import os
import django
from mongoengine import connect
from pymongo.errors import ServerSelectionTimeoutError

# Configure minimal Django settings
from django.conf import settings
if not settings.configured:
    settings.configure(
        DATABASES={'default': {'ENGINE': 'django.db.backends.dummy'}},
        SECRET_KEY='test-key',
    )
import django
django.setup()

# Test Connection
uri = "mongodb://localhost:27017/foodlink_campus"
print(f"Attempting to connect to: {uri}")

try:
    # Set a short timeout for testing
    conn = connect(host=uri, serverSelectionTimeoutMS=2000)
    print("Connection object created.")
    
    # Trigger actual connection
    conn.server_info() 
    print("SUCCESS: Connected to MongoDB!")
    
    from api.models import User
    count = User.objects.count()
    print(f"User count: {count}")

except ServerSelectionTimeoutError as e:
    print(f"\nFAILURE: Could not connect to MongoDB.\nError: {e}")
except Exception as e:
    print(f"\nFAILURE: Unexpected error.\nError: {e}")
