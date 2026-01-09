"""
Quick script to verify warehouse URLs are registered
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver

def list_urls(resolver, prefix=''):
    """Recursively list all URL patterns"""
    urls = []
    for pattern in resolver.url_patterns:
        if isinstance(pattern, URLResolver):
            urls.extend(list_urls(pattern, prefix + str(pattern.pattern)))
        elif isinstance(pattern, URLPattern):
            urls.append(prefix + str(pattern.pattern))
    return urls

resolver = get_resolver()
all_urls = list_urls(resolver)

# Filter for warehouse URLs
warehouse_urls = [url for url in all_urls if 'warehouse' in url]

print("\n=== WAREHOUSE URLs ===")
if warehouse_urls:
    for url in warehouse_urls:
        print(f"  {url}")
else:
    print("  ❌ No warehouse URLs found!")
    print("\n  This means the warehouse app routes are not registered.")
    print("  Please restart the Django server.")

print("\n=== ALL API URLs (sample) ===")
api_urls = [url for url in all_urls if 'api/' in url][:10]
for url in api_urls:
    print(f"  {url}")
