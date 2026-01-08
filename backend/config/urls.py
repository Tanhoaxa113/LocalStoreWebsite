"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Unregister TokenProxy model from admin to hide it from the admin interface
# This must be done here (not in apps.py or admin.py) to ensure it runs
# AFTER admin autodiscovery has registered all models
# Note: rest_framework.authtoken registers TokenProxy, not Token
try:
    from rest_framework.authtoken.models import TokenProxy
    if admin.site.is_registered(TokenProxy):
        admin.site.unregister(TokenProxy)
except Exception:
    # Silently ignore if authtoken is not installed or TokenProxy not registered
    pass

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('config.api_urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
