"""
Test warehouse URLs accessibility
"""
import requests

BASE_URL = "http://127.0.0.1:8000"

# Test endpoints
endpoints = [
    "/api/",
    "/api/warehouse/",
    "/api/warehouse/inventory/",
    "/api/warehouse/inventory/low-stock/",
    "/api/warehouse/import-notes/",
]

print("Testing warehouse API endpoints...")
print("=" * 50)

for endpoint in endpoints:
    try:
        response = requests.get(BASE_URL + endpoint, timeout=2)
        status = f"✓ {response.status_code}" if response.status_code < 400 else f"✗ {response.status_code}"
        print(f"{status:8} {endpoint}")
        
        if response.status_code == 404:
            print(f"         Response: {response.text[:100]}")
    except requests.exceptions.RequestException as e:
        print(f"✗ ERROR  {endpoint}")
        print(f"         {str(e)[:100]}")

print("=" * 50)
