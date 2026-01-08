"""
User Serializers
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserAddress

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer cho User Profile"""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'date_of_birth', 'avatar',
            'address_line1', 'address_line2', 'city', 'district', 'ward',
            'postal_code', 'country',
            'receive_newsletter', 'receive_order_updates',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'username', 'email', 'created_at', 'updated_at']


class UserAddressSerializer(serializers.ModelSerializer):
    """Serializer cho User Address"""
    
    full_address = serializers.CharField(source='get_full_address', read_only=True)
    
    class Meta:
        model = UserAddress
        fields = [
            'id', 'label', 'recipient_name', 'recipient_phone',
            'address_line1', 'address_line2', 'city', 'district', 'ward',
            'postal_code', 'country', 'is_default', 'full_address',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validation"""
        # Nếu không có label, tự động tạo
        if not data.get('label'):
            user = self.context['request'].user
            count = UserAddress.objects.filter(user=user).count()
            data['label'] = f'Địa chỉ {count + 1}'
        
        return data
