from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Product, ProductVariant
from django.contrib.auth import get_user_model

User = get_user_model()

class ProductCreateAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='admin', password='password', is_staff=True)
        self.client.force_authenticate(user=self.user)
        
        self.category = Category.objects.create(name='Eyewear')
        
    def test_create_product_with_initial_variant(self):
        url = reverse('product-list') # Assuming router maps this to product-list
        data = {
            'name': 'Test New Product',
            'brand': 'Test Brand',
            'category': self.category.id,
            'base_price': '199.99',
            'short_description': 'Test Short',
            'description': 'Test Desc',
            'target_gender': 'unisex',
            'sku_prefix': 'TEST-PFX',
            'initial_variant': {
                'sku': 'TEST-SKU-001',
                'color': 'Black',
                'size': 'M',
                'material': 'acetate',
                'lens_type': 'clear',
                'price': '199.99',
                'stock': 0
            }
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(ProductVariant.objects.count(), 1)
        
        product = Product.objects.first()
        self.assertEqual(product.name, 'Test New Product')
        
        variant = ProductVariant.objects.first()
        self.assertEqual(variant.product, product)
        self.assertEqual(variant.sku, 'TEST-SKU-001')
        self.assertEqual(variant.stock, 0)
