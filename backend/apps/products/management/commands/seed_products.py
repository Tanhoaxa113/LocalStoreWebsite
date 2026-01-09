import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.products.models import Product, ProductVariant, Category

class Command(BaseCommand):
    help = 'Seeds the database with 50 sample products'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')
        
        # Ensure categories exist
        categories = ['Eyewear', 'Sunglasses', 'Reading Glasses', 'Frames']
        category_objs = []
        for cat_name in categories:
            cat, _ = Category.objects.get_or_create(name=cat_name)
            category_objs.append(cat)
            
        brands = ['Ray-Ban', 'Oakley', 'Gucci', 'Prada', 'Versace']
        colors = ['Black', 'Gold', 'Silver', 'Tortoise', 'Blue', 'Red']
        materials = ['acetate', 'metal', 'titanium', 'plastic']
        lens_types = ['clear', 'polarized', 'sunglasses']
        
        # Generate 50 products
        for i in range(50):
            name = f"Sample Product {i+1}"
            brand = random.choice(brands)
            
            product = Product.objects.create(
                name=name,
                category=random.choice(category_objs),
                brand=brand,
                short_description=f"This is a short description for {name}",
                description=f"<p>Full description for {name}. High quality eyewear.</p>",
                base_price=Decimal('10000000'), # Placeholder, actual price in variants
                is_active=True,
                is_featured=random.choice([True, False]),
                is_new_arrival=random.choice([True, False]),
                target_gender=random.choice(['unisex', 'male', 'female'])
            )
            
            # Create 1-4 variants
            num_variants = random.randint(1, 4)
            for j in range(num_variants):
                price = Decimal(random.randint(10000000, 15000000))
                
                ProductVariant.objects.create(
                    product=product,
                    color=random.choice(colors),
                    size=random.choice(['S', 'M', 'L']),
                    material=random.choice(materials),
                    lens_type=random.choice(lens_types),
                    price=price,
                    stock=random.randint(10, 100),
                    is_active=True,
                    is_default=(j==0) # Make first variant default
                )
                
            self.stdout.write(f"Created product: {name} with {num_variants} variants")
            
        self.stdout.write(self.style.SUCCESS('Successfully seeded 50 products'))
