"""
Custom Authentication Backend
Supports login with Email OR Username
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()


class EmailOrUsernameBackend(ModelBackend):
    """
    Custom authentication backend that allows users to log in using
    either their email address OR username with their password.
    
    Usage in settings.py:
        AUTHENTICATION_BACKENDS = [
            'apps.users.authentication.EmailOrUsernameBackend',
            'django.contrib.auth.backends.ModelBackend',
        ]
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate user with email or username
        
        Args:
            request: HTTP request object
            username: Can be either email or username
            password: User's password
            **kwargs: Additional keyword arguments
            
        Returns:
            User object if authentication successful, None otherwise
        """
        if username is None or password is None:
            return None
        
        try:
            # Check if the username is an email (contains '@')
            if '@' in username:
                # Try to find user by email
                user = User.objects.get(email=username)
            else:
                # Try to find user by username
                user = User.objects.get(username=username)
            
            # Verify password
            if user.check_password(password):
                return user
            
        except User.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a nonexistent user (#20760).
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # This should not happen with unique constraints, but handle it
            return None
        
        return None
    
    def get_user(self, user_id):
        """
        Get user by primary key
        
        Args:
            user_id: User's primary key
            
        Returns:
            User object if found, None otherwise
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
