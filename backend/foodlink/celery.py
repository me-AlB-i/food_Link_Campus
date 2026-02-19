"""
Celery configuration for FoodLink Campus
Handles periodic tasks like food escalation
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'foodlink.settings')

app = Celery('foodlink')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Schedule - Periodic Tasks
app.conf.beat_schedule = {
    'escalate-expired-food-every-5-minutes': {
        'task': 'api.tasks.escalate_expired_food',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    'expire-uncollected-reservations-every-10-minutes': {
        'task': 'api.tasks.expire_uncollected_reservations',
        'schedule': crontab(minute='*/10'),  # Every 10 minutes
    },
}
