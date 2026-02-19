"""
FoodLink Campus - API URL Routing
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    # Auth
    RegisterView, LoginView, VerifyOTPView, ProfileView, GoogleLoginView,
    # Food
    FoodItemListView, FoodItemCreateView, FoodItemDetailView,
    StaffFoodListView, EscalatedFoodView,
    # Reservations
    ReservationCreateView, ReservationListView, ReservationDetailView,
    QRVerifyView, StaffClaimsView, BulkReservationCreateView,
    # Routes
    RouteCreateView, RouteListView, RouteDetailView,
    # Notifications
    NotificationListView, NotificationMarkReadView, NotificationMarkAllReadView,
    # Stats
    LeaderboardView, ImpactStatsView, ImpactReportView,
    # Chat
    ChatbotView,
    # Admin
    AdminUserListView, AdminUserDetailView,
    # Support
    SupportChatView, AdminSupportChatListView, AdminSupportChatDetailView
)

urlpatterns = [
    # ==========================================================================
    # AUTHENTICATION
    # ==========================================================================
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    
    # ==========================================================================
    # FOOD ITEMS
    # ==========================================================================
    path('food/', FoodItemListView.as_view(), name='food_list'),
    path('food/create/', FoodItemCreateView.as_view(), name='food_create'),
    path('food/my-listings/', StaffFoodListView.as_view(), name='staff_food_list'),
    path('food/escalated/', EscalatedFoodView.as_view(), name='escalated_food'),
    path('food/<str:food_id>/', FoodItemDetailView.as_view(), name='food_detail'),
    
    # ==========================================================================
    # RESERVATIONS
    # ==========================================================================
    path('reservations/', ReservationListView.as_view(), name='reservation_list'),
    path('reservations/create/', ReservationCreateView.as_view(), name='reservation_create'),
    path('reservations/bulk/', BulkReservationCreateView.as_view(), name='reservation_bulk'),
    path('reservations/verify-qr/', QRVerifyView.as_view(), name='verify_qr'),
    path('reservations/staff-claims/', StaffClaimsView.as_view(), name='staff_claims'),
    path('reservations/<str:reservation_id>/', ReservationDetailView.as_view(), name='reservation_detail'),
    
    # ==========================================================================
    # ROUTES (Charity)
    # ==========================================================================
    path('routes/', RouteListView.as_view(), name='route_list'),
    path('routes/create/', RouteCreateView.as_view(), name='route_create'),
    path('routes/<str:route_id>/', RouteDetailView.as_view(), name='route_detail'),
    
    # ==========================================================================
    # NOTIFICATIONS
    # ==========================================================================
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notification_read_all'),
    path('notifications/<str:notification_id>/read/', NotificationMarkReadView.as_view(), name='notification_read'),
    
    # ==========================================================================
    # LEADERBOARD & STATS
    # ==========================================================================
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('stats/impact/', ImpactStatsView.as_view(), name='impact_stats'),
    path('stats/report/', ImpactReportView.as_view(), name='impact_report'),
    
    # ==========================================================================
    # AI CHATBOT
    # ==========================================================================
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    
    # ==========================================================================
    # ADMIN
    # ==========================================================================
    path('admin/users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/users/<str:user_id>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    
    # ==========================================================================
    # SUPPORT CHAT
    # ==========================================================================
    path('support/', SupportChatView.as_view(), name='support_chat'),
    path('admin/support/users/', AdminSupportChatListView.as_view(), name='admin_support_users'),
    path('admin/support/users/<str:user_id>/', AdminSupportChatDetailView.as_view(), name='admin_support_detail'),
]
