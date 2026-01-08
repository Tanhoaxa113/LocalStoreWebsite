"""
Django management command to generate sample eyewear products
Usage: python manage.py generate_sample_products
"""

from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.products.models import Category, Product, ProductVariant
from decimal import Decimal
import random


class Command(BaseCommand):
    help = 'Generate 40 sample eyewear products with 3-4 variants each'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting sample product generation...'))
        
        # First, ensure categories exist
        categories = self.create_categories()
        
        # Generate products
        products_created = self.generate_products(categories)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully generated {products_created} products with variants!'
            )
        )

    def create_categories(self):
        """Create product categories if they don't exist"""
        category_data = [
            {
                'name': 'Sunglasses',
                'description': 'Stylish sunglasses for UV protection',
                'display_order': 1
            },
            {
                'name': 'Prescription Glasses',
                'description': 'Eyeglasses for vision correction',
                'display_order': 2
            },
            {
                'name': 'Blue Light Glasses',
                'description': 'Glasses to protect from blue light',
                'display_order': 3
            },
            {
                'name': 'Reading Glasses',
                'description': 'Comfortable reading glasses',
                'display_order': 4
            },
            {
                'name': 'Sports Glasses',
                'description': 'Durable glasses for sports activities',
                'display_order': 5
            },
        ]
        
        categories = {}
        for cat_data in category_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults={
                    'slug': slugify(cat_data['name']),
                    'description': cat_data['description'],
                    'display_order': cat_data['display_order'],
                    'is_active': True
                }
            )
            categories[cat_data['name']] = category
            if created:
                self.stdout.write(f'Created category: {category.name}')
        
        return categories

    def generate_products(self, categories):
        """Generate 40 sample products"""
        
        brands = ['Ray-Ban', 'Oakley', 'Gucci', 'Prada', 'Versace', 'Tom Ford', 
                  'Persol', 'Warby Parker', 'Maui Jim', 'Costa Del Mar']
        
        styles = ['Aviator', 'Wayfarer', 'Cat Eye', 'Round', 'Square', 'Pilot',
                  'Clubmaster', 'Browline', 'Oversized', 'Geometric', 'Retro', 'Classic']
        
        descriptors = ['Premium', 'Luxury', 'Vintage', 'Modern', 'Sleek', 'Bold',
                       'Elegant', 'Sporty', 'Timeless', 'Designer', 'Signature', 'Elite']
        
        colors = [
            ('Black', '#000000'),
            ('Tortoise', '#8B4513'),
            ('Gold', '#FFD700'),
            ('Silver', '#C0C0C0'),
            ('Brown', '#8B4500'),
            ('Blue', '#1E90FF'),
            ('Green', '#228B22'),
            ('Pink', '#FF69B4'),
            ('Rose Gold', '#B76E79'),
            ('Gunmetal', '#2C3539'),
            ('Havana', '#CD853F'),
            ('Crystal Clear', '#E8F4F8'),
        ]
        
        materials = ['acetate', 'metal', 'titanium', 'plastic', 'mixed']
        lens_types = ['clear', 'prescription', 'polarized', 'photochromic', 'blue_light', 'sunglasses']
        sizes = ['S', 'M', 'L']
        genders = ['unisex', 'male', 'female']
        
        products_created = 0
        
        for i in range(40):
            # Random product attributes
            brand = random.choice(brands)
            style = random.choice(styles)
            descriptor = random.choice(descriptors)
            category = random.choice(list(categories.values()))
            gender = random.choice(genders)
            
            # Generate product name
            product_name = f"{brand} {descriptor} {style}"
            
            # Ensure unique name
            counter = 1
            original_name = product_name
            while Product.objects.filter(name=product_name).exists():
                product_name = f"{original_name} {counter}"
                counter += 1
            
            # Generate SKU prefix
            sku_prefix = f"{brand[:3].upper()}-{style[:3].upper()}-{i+1:03d}"
            
            # Base price
            base_price = Decimal(random.randint(5000000, 15000000))
            
            # Create product
            product = Product.objects.create(
                name=product_name,
                slug=slugify(product_name),
                sku_prefix=sku_prefix,
                category=category,
                brand=brand,
                short_description=f"{descriptor} {style} eyewear from {brand}. Perfect blend of style and functionality.",
                description=f"""
                <h2>{product_name}</h2>
                <p>Discover the perfect combination of style and comfort with our {descriptor.lower()} {style.lower()} design.</p>
                <h3>Features:</h3>
                <ul>
                    <li>Premium quality materials</li>
                    <li>UV protection</li>
                    <li>Lightweight and durable</li>
                    <li>Comfortable nose pads</li>
                    <li>Scratch-resistant lenses</li>
                </ul>
                <p>Whether you're looking for everyday wear or a special occasion, these glasses deliver exceptional quality and timeless style.</p>
                """,
                target_gender=gender,
                base_price=base_price,
                is_active=True,
                is_featured=random.choice([True, False]) if i < 10 else False,
                is_new_arrival=random.choice([True, False]) if i < 15 else False,
                is_best_seller=random.choice([True, False]) if i < 8 else False,
                meta_title=f"{product_name} - {brand} Eyewear",
                meta_description=f"Shop {product_name} from {brand}. {descriptor} {style} design with premium quality.",
                meta_keywords=f"{brand}, {style}, eyewear, glasses, {category.name.lower()}"
            )
            
            # Generate 3-4 variants for each product
            num_variants = random.randint(3, 4)
            selected_colors = random.sample(colors, num_variants)
            
            for j, (color_name, color_hex) in enumerate(selected_colors):
                material = random.choice(materials)
                lens_type = random.choice(lens_types)
                size = random.choice(sizes)
                
                # Generate variant SKU
                variant_sku = f"{sku_prefix}-{color_name[:3].upper()}-{size}"
                
                # Price variation
                price = base_price + Decimal(random.randint(-2000000, 5000000))
                
                # 30% chance of being on sale
                sale_price = None
                if random.random() < 0.3:
                    discount_percent = random.randint(10, 40)
                    sale_price = price * Decimal(1 - discount_percent / 100)
                    sale_price = sale_price.quantize(Decimal('0.01'))
                
                # Stock levels
                stock = random.randint(0, 100)
                
                # Dimensions (in mm)
                lens_width = Decimal(random.randint(45, 65))
                bridge_width = Decimal(random.randint(14, 22))
                temple_length = Decimal(random.randint(130, 150))
                
                # Create variant
                ProductVariant.objects.create(
                    product=product,
                    sku=variant_sku,
                    color=color_name,
                    color_hex=color_hex,
                    material=material,
                    lens_type=lens_type,
                    size=size,
                    lens_width=lens_width,
                    bridge_width=bridge_width,
                    temple_length=temple_length,
                    price=price,
                    sale_price=sale_price,
                    stock=stock,
                    weight=Decimal(random.randint(20, 50)),
                    is_active=True,
                    is_default=(j == 0)  # First variant is default
                )
            
            products_created += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created product {products_created}/40: {product_name} with {num_variants} variants'
                )
            )
        
        return products_created
