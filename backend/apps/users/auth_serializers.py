"""
Authentication Serializers
Handles Login, Registration, Password Reset
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    Accepts email OR username + password
    """
    username = serializers.CharField(
        required=True,
        help_text="Email hoặc tên đăng nhập"
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate credentials and authenticate user"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            # Use custom authentication backend
            user = authenticate(
                request=self.context.get('request'),
                username=username,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError(
                    'Email/Tên đăng nhập hoặc mật khẩu không đúng.',
                    code='authorization'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'Tài khoản đã bị vô hiệu hóa.',
                    code='authorization'
                )
        else:
            raise serializers.ValidationError(
                'Vui lòng nhập email/tên đăng nhập và mật khẩu.',
                code='authorization'
            )
        
        attrs['user'] = user
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    Email and Username are required
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }
    
    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                'Email này đã được sử dụng.'
            )
        return value
    
    def validate_username(self, value):
        """Check if username already exists"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                'Tên đăng nhập này đã được sử dụng.'
            )
        return value
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Mật khẩu xác nhận không khớp.'
            })
        return attrs
    
    def create(self, validated_data):
        """Create new user"""
        # Remove password_confirm from validated data
        validated_data.pop('password_confirm')
        
        # Create user with hashed password
        user = User.objects.create_user(**validated_data)
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    """
    Serializer for forgot password request
    Sends password reset email
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Check if email exists"""
        try:
            user = User.objects.get(email=value)
            self.context['user'] = user
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            # But still validate the format
            pass
        return value
    
    def save(self):
        """Send password reset email"""
        email = self.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            
            # Generate password reset token
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build reset URL (frontend URL)
            reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?uid={uid}&token={token}"
            
            # Send email
            subject = 'Đặt lại mật khẩu - Shop Kính Mắt Hàn Quốc'
            message = f"""
Xin chào {user.get_full_name() or user.username},

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.

Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:
{reset_url}

Liên kết này sẽ hết hạn sau 24 giờ.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

Chúc bạn một năm mới an khang thịnh vượng!
Shop Kính Mắt Hàn Quốc
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            
        except User.DoesNotExist:
            # Don't reveal if email doesn't exist
            pass


class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for password reset with token
    """
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate token and passwords"""
        # Validate password confirmation
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Mật khẩu xác nhận không khớp.'
            })
        
        # Decode uid and get user
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({
                'uid': 'Liên kết đặt lại mật khẩu không hợp lệ.'
            })
        
        # Validate token
        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({
                'token': 'Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.'
            })
        
        attrs['user'] = user
        return attrs
    
    def save(self):
        """Reset user password"""
        user = self.validated_data['user']
        new_password = self.validated_data['new_password']
        
        user.set_password(new_password)
        user.save()
        
        return user
