@echo off
REM Setup script for Inventory Management Module
REM This will install dependencies and run migrations

echo ========================================
echo Inventory Module Setup
echo ========================================
echo.

echo Step 1: Installing Django dependencies...
pip install django djangorestframework django-cors-headers django-filter psycopg2-binary python-decouple dj-database-url

echo.
echo Step 2: Creating migrations for warehouse app...
python manage.py makemigrations warehouse

echo.
echo Step 3: Running migrations...
python manage.py migrate

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Restart your Django server: python manage.py runserver
echo 2. Navigate to: http://localhost:3000/admin/inventory
echo.
pause
