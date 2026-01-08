"""
User Profile and Address Management Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import UserAddress
from .serializers import UserSerializer, UserAddressSerializer

User = get_user_model()


class UserProfileViewSet(viewsets.ViewSet):
    """
    ViewSet cho User Profile - Hồ sơ người dùng
    """
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        """Xem thông tin profile"""
        # pk is ignored, always return current user's profile
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        """Cập nhật thông tin cá nhân"""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Đổi mật khẩu"""
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {'error': 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify current password
        if not user.check_password(current_password):
            return Response(
                {'error': 'Mật khẩu hiện tại không đúng'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password (basic validation)
        if len(new_password) < 8:
            return Response(
                {'error': 'Mật khẩu mới phải có ít nhất 8 ký tự'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'message': 'Đổi mật khẩu thành công'},
            status=status.HTTP_200_OK
        )


class UserAddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet cho User Addresses - Địa chỉ giao hàng
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserAddressSerializer
    
    def get_queryset(self):
        """Chỉ lấy địa chỉ của user hiện tại"""
        return UserAddress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Tự động gán user khi tạo địa chỉ mới"""
        # Nếu đây là địa chỉ mặc định, bỏ default của các địa chỉ khác
        if serializer.validated_data.get('is_default', False):
            UserAddress.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """Xử lý cập nhật địa chỉ"""
        # Nếu set làm default, bỏ default của các địa chỉ khác
        if serializer.validated_data.get('is_default', False):
            UserAddress.objects.filter(user=self.request.user, is_default=True).exclude(pk=serializer.instance.pk).update(is_default=False)
        
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Đặt địa chỉ làm mặc định"""
        address = self.get_object()
        
        # Bỏ default của các địa chỉ khác
        UserAddress.objects.filter(user=request.user, is_default=True).update(is_default=False)
        
        # Set địa chỉ này làm default
        address.is_default = True
        address.save()
        
        serializer = self.get_serializer(address)
        return Response(serializer.data)
