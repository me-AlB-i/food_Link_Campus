"""
FoodLink Campus - Custom Permission Classes
Role-Based Access Control (RBAC) implementation
"""
from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    """
    Permission class for canteen staff only.
    Allows access to food listing and collection verification.
    """
    message = "Only canteen staff can perform this action."
    
    def has_permission(self, request, view):
        if not request.user or not hasattr(request.user, 'role'):
            return False
        return request.user.role == 'staff'


class IsStudent(BasePermission):
    """
    Permission class for students only.
    Allows access to reservations and marketplace.
    """
    message = "Only students can perform this action."
    
    def has_permission(self, request, view):
        if not request.user or not hasattr(request.user, 'role'):
            return False
        return request.user.role == 'student'


class IsCharity(BasePermission):
    """
    Permission class for charity organizations only.
    Allows access to escalated food and route management.
    """
    message = "Only charity organizations can perform this action."
    
    def has_permission(self, request, view):
        if not request.user or not hasattr(request.user, 'role'):
            return False
        return request.user.role == 'charity'


class IsAdmin(BasePermission):
    """
    Permission class for administrators only.
    Allows access to analytics and user management.
    """
    message = "Only administrators can perform this action."
    
    def has_permission(self, request, view):
        if not request.user or not hasattr(request.user, 'role'):
            return False
        return request.user.role == 'admin'


class IsStaffOrAdmin(BasePermission):
    """
    Permission class for staff or admin.
    Used for food listing management.
    """
    message = "Only staff or administrators can perform this action."
    
    def has_permission(self, request, view):
        if not request.user or not hasattr(request.user, 'role'):
            return False
        return request.user.role in ['staff', 'admin']


class IsStudentOrStaff(BasePermission):
    """
    Permission class for students or staff.
    Used for viewing food items.
    """
    message = "Only students or staff can perform this action."
    
    def has_permission(self, request, view):
        if not request.user or not hasattr(request.user, 'role'):
            return False
        return request.user.role in ['student', 'staff']


class IsAuthenticated(BasePermission):
    """
    Custom authenticated check for MongoEngine users.
    """
    message = "Authentication required."
    
    def has_permission(self, request, view):
        return request.user is not None and hasattr(request.user, 'id')


class ReadOnly(BasePermission):
    """
    Allow read-only access (GET, HEAD, OPTIONS).
    """
    def has_permission(self, request, view):
        return request.method in ['GET', 'HEAD', 'OPTIONS']


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission to only allow owners or admins.
    """
    message = "You don't have permission to access this resource."
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not hasattr(request.user, 'role'):
            return False
        
        # Admin can access anything
        if request.user.role == 'admin':
            return True
        
        # Check if user owns the object
        if hasattr(obj, 'student') and obj.student:
            return str(obj.student.id) == str(request.user.id)
        if hasattr(obj, 'listed_by') and obj.listed_by:
            return str(obj.listed_by.id) == str(request.user.id)
        if hasattr(obj, 'charity') and obj.charity:
            return str(obj.charity.id) == str(request.user.id)
        
        return False
