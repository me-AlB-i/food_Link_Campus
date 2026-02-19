
from django.core.management.base import BaseCommand
from api.models import FoodItem, Reservation
from datetime import datetime

class Command(BaseCommand):
    help = 'Escalate expired food items to charity'

    def handle(self, *args, **kwargs):
        now = datetime.utcnow()
        expired_count = 0
        
        # 1. Escalate Available Food past window
        expired_items = FoodItem.objects(
            status='available',
            pickup_window_end__lt=now
        )
        
        for item in expired_items:
            try:
                # Check if this item is truly expired (double check status because mongo engine objects filter is good but explicit loop is safe for updates)
                if item.status == 'available': # Atomic check ideally
                    self.stdout.write(f"Escalating: {item.name}")
                    item.mark_escalated()
                    expired_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to escalate {item.name}: {str(e)}"))
        
        # 2. Expire Reservations past window (This also escalates the food)
        active_reservations = Reservation.objects(status='active')
        reservation_expired_count = 0
        
        for res in active_reservations:
            if res.food_item.pickup_window_end < now:
                self.stdout.write(f"Expiring Reservation: {res.id} for {res.food_item.name}")
                res.status = 'expired'
                res.save()
                
                # Make food available again for CHARITY (Escalate)
                res.food_item.mark_escalated()
                reservation_expired_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully escalated {expired_count} available items and expired {reservation_expired_count} reservations'))
