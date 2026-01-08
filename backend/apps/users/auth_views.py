"""
Authentication API Views
Login, Register, Logout, Forgot Password, Reset Password
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from .auth_serializers import (
    LoginSerializer,
    RegisterSerializer,
    ForgotPasswordSerializer,
    PasswordResetSerializer
)
from .serializers import UserSerializer

User = get_user_model()


class LoginView(APIView):
    """
    POST /api/auth/login/
    Login with email OR username + password
    Returns: user data + auth token
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Get or create auth token
            token, created = Token.objects.get_or_create(user=user)
            
            # Return user data + token
            user_serializer = UserSerializer(user)
            
            return Response({
                'token': token.key,
                'user': user_serializer.data,
                'message': 'Đăng nhập thành công!'
            }, status=status.HTTP_200_OK)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Register new user account
    Returns: user data + auth token
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Create auth token
            token = Token.objects.create(user=user)
            
            # Return user data + token
            user_serializer = UserSerializer(user)
            
            return Response({
                'token': token.key,
                'user': user_serializer.data,
                'message': 'Đăng ký thành công!'
            }, status=status.HTTP_201_CREATED)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Logout user (delete auth token)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Delete the user's token
            request.user.auth_token.delete()
            return Response({
                'message': 'Đăng xuất thành công!'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Có lỗi xảy ra khi đăng xuất.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Send password reset email
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            
            return Response({
                'message': 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu.'
            }, status=status.HTTP_200_OK)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class PasswordResetView(APIView):
    """
    POST /api/auth/reset-password/
    Reset password with token
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            
            return Response({
                'message': 'Mật khẩu đã được đặt lại thành công!'
            }, status=status.HTTP_200_OK)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    Get current authenticated user data
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
