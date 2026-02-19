"""
FoodLink Campus - Custom JWT Authentication
Custom authentication backend for MongoEngine User model
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .models import User


class MongoEngineJWTAuthentication(BaseAuthentication):
    """
    Custom JWT authentication for MongoEngine users.
    
    Since MongoEngine doesn't use Django's auth system, we need a custom
    authentication class that:
    1. Extracts the JWT from the Authorization header
    2. Validates the token
    3. Retrieves the user from MongoDB
    """
    
    def authenticate(self, request):
        """
        Authenticate the request and return a tuple of (user, token) or None.
        """
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return None
        
        # Check for Bearer token
        parts = auth_header.split()
        
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
        
        token_string = parts[1]
        
        try:
            # Validate and decode the token
            token = AccessToken(token_string)
            
            # Extract user_id from token payload
            user_id = token.get('user_id')
            
            if not user_id:
                raise AuthenticationFailed('Token contains no valid user identifier')
            
            # Retrieve user from MongoDB
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise AuthenticationFailed('User not found')
            
            if not user.is_active:
                raise AuthenticationFailed('User is inactive')
            
            return (user, token)
            
        except TokenError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')
        except InvalidToken as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the WWW-Authenticate
        header in a 401 Unauthenticated response.
        """
        return 'Bearer'


class OptionalJWTAuthentication(MongoEngineJWTAuthentication):
    """
    Optional JWT authentication - doesn't fail if no token is provided.
    Useful for endpoints that work differently for authenticated vs anonymous users.
    """
    
    def authenticate(self, request):
        """
        Returns None if no token is provided (allows anonymous access).
        """
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return None
        
        return super().authenticate(request)
