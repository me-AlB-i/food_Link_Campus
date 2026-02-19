from datetime import datetime
from .models import FoodItem, Reservation

def check_and_escalate_expired_items():
    """
    Lazy escalation: Checks for expired items when needed (e.g. before showing charity dashboard).
    This ensures development environments (without background workers) still behave correctly.
    """
    now = datetime.utcnow()
    
    # 1. Escalate Available Food past window
    expired_items = FoodItem.objects(
        status='available',
        pickup_window_end__lt=now
    )
    
    for item in expired_items:
        try:
            # Double check status to be safe
            if item.status == 'available':
                item.mark_escalated()
        except Exception:
            # Log error or pass - silently fail individual items to prevent crashing the view
            pass

    # 2. Expire Reservations -> Escalate Food
    # Note: iterating all active reservations might be heavy in prod, but fine for dev/MVP.
    # Ideally filter by food_item__pickup_window_end if possible, but MongoEngine joins are tricky.
    # Better: Users fetch their own reservations, so lazy check there too? 
    # For Charity view, we care about 'escalated' items appearing.
    # So we MUST check reservations that should have expired and become escalated.
    
    active_reservations = Reservation.objects(status='active')
    
    for res in active_reservations:
        try:
            if res.food_item and res.food_item.pickup_window_end and res.food_item.pickup_window_end < now:
                res.status = 'expired'
                res.save()
                
                # Make food available for CHARITY (Escalate)
                if res.food_item:
                    res.food_item.mark_escalated()
        except Exception:
            pass
