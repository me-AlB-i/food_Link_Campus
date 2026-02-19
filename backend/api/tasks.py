"""
FoodLink Campus - Celery Tasks
Background tasks for food escalation and cleanup
"""
from celery import shared_task
from datetime import datetime
from .models import FoodItem, Reservation, Notification, User


@shared_task
def escalate_expired_food():
    """
    Periodic task: Escalate unclaimed food to charity.
    Runs every 5 minutes via Celery Beat.
    
    Logic:
    - Find food items with status='available' past pickup_window_end
    - Change status to 'escalated'
    - Notify all charity users
    """
    now = datetime.utcnow()
    
    # Find expired available food
    expired_items = FoodItem.objects(
        status='available',
        pickup_window_end__lt=now
    )
    
    escalated_count = 0
    for item in expired_items:
        item.mark_escalated()
        escalated_count += 1
        
        # Notify all charity users
        notify_charities_about_escalation.delay(str(item.id))
    
    return f"Escalated {escalated_count} food items to charity"


@shared_task
def expire_uncollected_reservations():
    """
    Periodic task: Expire reservations past pickup window.
    Runs every 10 minutes via Celery Beat.
    
    Logic:
    - Find active reservations where food's pickup_window_end has passed
    - Mark reservation as expired
    - Optionally return food to available pool or escalate
    """
    now = datetime.utcnow()
    
    expired_count = 0
    active_reservations = Reservation.objects(status='active')
    
    for reservation in active_reservations:
        if reservation.food_item.pickup_window_end < now:
            reservation.status = 'expired'
            reservation.save()
            
            # Escalate the food item
            reservation.food_item.mark_escalated()
            expired_count += 1
            
            # Notify student about expired reservation
            create_notification.delay(
                str(reservation.student.id),
                "Reservation Expired",
                f"Your reservation for {reservation.food_item.name} has expired.",
                "reservation"
            )
    
    return f"Expired {expired_count} uncollected reservations"


@shared_task
def notify_charities_about_escalation(food_item_id: str):
    """
    Notify all charity users about newly escalated food.
    """
    try:
        food_item = FoodItem.objects.get(id=food_item_id)
        charity_users = User.objects(role='charity', is_active=True)
        
        for charity in charity_users:
            Notification(
                recipient=charity,
                title="New Food Available for Pickup",
                message=f"{food_item.quantity} {food_item.unit} of {food_item.name} "
                        f"available at {food_item.location_name or 'Campus Canteen'}",
                notification_type='escalation',
                food_item=food_item
            ).save()
        
        return f"Notified {charity_users.count()} charities"
    
    except Exception as e:
        return f"Error notifying charities: {str(e)}"


@shared_task
def notify_students_about_new_food(food_item_id: str):
    """
    Notify students about newly listed food.
    Could be optimized to notify based on preferences.
    """
    try:
        food_item = FoodItem.objects.get(id=food_item_id)
        
        # For now, notify all active students
        # In production, this could filter by preferences
        student_users = User.objects(role='student', is_active=True)
        
        for student in student_users:
            Notification(
                recipient=student,
                title="New Food Available!",
                message=f"{food_item.name} ({food_item.quantity} {food_item.unit}) "
                        f"- {food_item.food_type.upper()}",
                notification_type='new_food',
                food_item=food_item
            ).save()
        
        return f"Notified {student_users.count()} students"
    
    except Exception as e:
        return f"Error notifying students: {str(e)}"


@shared_task
def create_notification(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = 'system'
):
    """
    Create a notification for a specific user.
    """
    try:
        user = User.objects.get(id=user_id)
        
        Notification(
            recipient=user,
            title=title,
            message=message,
            notification_type=notification_type
        ).save()
        
        return f"Notification created for {user.username}"
    
    except Exception as e:
        return f"Error creating notification: {str(e)}"


@shared_task
def award_points_for_collection(reservation_id: str, points: int = 10):
    """
    Award sustainability points when food is collected.
    """
    try:
        reservation = Reservation.objects.get(id=reservation_id)
        
        if reservation.status == 'collected':
            reservation.student.add_points(points)
            
            # Create notification
            Notification(
                recipient=reservation.student,
                title="Points Earned! 🌱",
                message=f"You earned {points} Green Points for rescuing {reservation.food_item.name}!",
                notification_type='points',
                reservation=reservation
            ).save()
            
            return f"Awarded {points} points to {reservation.student.username}"
        
        return "Reservation not collected yet"
    
    except Exception as e:
        return f"Error awarding points: {str(e)}"


@shared_task
def cleanup_old_notifications():
    """
    Cleanup notifications older than 30 days.
    Run daily.
    """
    from datetime import timedelta
    
    cutoff = datetime.utcnow() - timedelta(days=30)
    deleted = Notification.objects(created_at__lt=cutoff).delete()
    
    return f"Deleted {deleted} old notifications"
