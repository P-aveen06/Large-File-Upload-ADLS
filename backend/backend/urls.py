"""
URL configuration for backend project.

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

"""
Main URL Configuration

This is the root URL configuration for the Django project.
It defines the main routing structure:

- /admin/: Django admin interface for database management
- /api/: RESTful API endpoints for file upload functionality

The API endpoints are delegated to the upload app's URL configuration,
which handles the chunked file upload system with Azure Blob Storage.
"""

urlpatterns = [
    # Django admin interface - accessible at /admin/
    # Provides web-based interface for managing database records
    path('admin/', admin.site.urls),
    
    # API endpoints - accessible at /api/
    # Delegates to upload app URLs for chunked file upload functionality
    # Includes: /api/stage/ and /api/commit/ endpoints
    path('api/', include('upload.urls')),
    path('files/', include('rest_framework_tus.urls')),
]
