# Korean Eyewear Shop - API Documentation

## Base URL
```
http://localhost:8000/api/
```

## Authentication
Most endpoints use Token Authentication. Include the token in the header:
```
Authorization: Token <your-token-here>
```

---

## Products API

### List Products
**GET** `/api/products/`

**Query Parameters:**
- `category` - Filter by category ID
- `brand` - Filter by brand name
- `target_gender` - Filter by gender (unisex, male, female, kids)
- `is_featured` - Filter featured products (true/false)
- `is_new_arrival` - Filter new arrivals (true/false)
- `is_best_seller` - Filter best sellers (true/false)
- `min_price` - Minimum price
- `max_price` - Maximum price
- `color` - Filter by color
- `lens_type` - Filter by lens type (clear, prescription, polarized, etc.)
- `material` - Filter by material (acetate, metal, titanium, etc.)
- `size` - Filter by size (XS, S, M, L, XL)
- `in_stock` - Filter by availability (true/false)
- `search` - Search in name, brand, description
- `ordering` - Sort by (created_at, -created_at, base_price, -base_price, view_count, -view_count, name, -name)

**Example:**
```bash
GET /api/products/?category=1&in_stock=true&ordering=-created_at
```

### Get Product Detail
**GET** `/api/products/{slug}/`

Returns full product details with all variants and media.

### Get Featured Products
**GET** `/api/products/featured/`

Returns top 10 featured products.

### Get New Arrivals
**GET** `/api/products/new_arrivals/`

Returns latest 10 new arrival products.

### Get Best Sellers
**GET** `/api/products/best_sellers/`

Returns top 10 best selling products.

### Get Related Products
**GET** `/api/products/{slug}/related/`

Returns up to 6 related products from the same category.

---

## Categories API

### List Categories
**GET** `/api/categories/`

**Query Parameters:**
- `parent` - Filter by parent category ID (use 'null' for top-level categories)

### Get Category Detail
**GET** `/api/categories/{slug}/`

---

## Product Variants API

### List Variants
**GET** `/api/variants/`

**Query Parameters:**
- `product` - Filter by product ID
- `product_slug` - Filter by product slug
- `color` - Filter by color
- `material` - Filter by material
- `lens_type` - Filter by lens type
- `size` - Filter by size
- `in_stock` - Filter by availability (true/false)

---

## Cart API

### Get Current Cart
**GET** `/api/cart/`

Returns current user's cart (or guest cart based on session).

**Response:**
```json
{
  "id": "uuid",
  "items": [
    {
      "id": 1,
      "variant": {...},
      "quantity": 2,
      "total_price": "500000.00",
      "product_name": "Ray-Ban Aviator",
      "product_slug": "ray-ban-aviator"
    }
  ],
  "total_items": 2,
  "subtotal": "500000.00"
}
```

### Add Item to Cart
**POST** `/api/cart/add_item/`

**Request Body:**
```json
{
  "variant_id": 1,
  "quantity": 1
}
```

If item already exists in cart, quantities are added together.

### Update Cart Item
**PATCH** `/api/cart/update_item/`

**Request Body:**
```json
{
  "item_id": 1,
  "quantity": 3
}
```

### Remove Item from Cart
**DELETE** `/api/cart/remove_item/`

**Request Body:**
```json
{
  "item_id": 1
}
```

### Clear Cart
**POST** `/api/cart/clear/`

Removes all items from cart.

### Check Cart Merge (On Login) 🔐
**POST** `/api/cart/merge_check/`

**Request Body:**
```json
{
  "session_key": "guest-session-key"
}
```

**Response Codes:**
- `MERGE_REQUIRED` - Both guest and user carts have items
- `CART_LOADED` - Single cart loaded (auto-merged or only one exists)

**Example Response (Merge Required):**
```json
{
  "code": "MERGE_REQUIRED",
  "message": "You have items in both your guest cart and saved cart. Would you like to merge them?",
  "guest_cart": {...},
  "user_cart": {...}
}
```

### Confirm Cart Merge 🔐
**POST** `/api/cart/merge_confirm/`

**Request Body:**
```json
{
  "session_key": "guest-session-key",
  "action": "merge"  // or "replace"
}
```

- `merge` - Combine guest cart + user cart
- `replace` - Discard guest cart, keep user cart

---

## Orders API

### List My Orders 🔐
**GET** `/api/orders/`

Returns all orders for the current user.

### Get Order Detail 🔐
**GET** `/api/orders/{id}/`

Returns full order details including items and shipping address.

### Create Order from Cart 🔐
**POST** `/api/orders/create_order/`

**Request Body:**
```json
{
  "email": "customer@example.com",
  "phone": "+84909123456",
  "shipping_full_name": "Nguyen Van A",
  "shipping_phone": "+84909123456",
  "shipping_address_line1": "123 Le Loi Street",
  "shipping_address_line2": "Apartment 5B",
  "shipping_ward": "Ben Nghe Ward",
  "shipping_district": "District 1",
  "shipping_city": "Ho Chi Minh City",
  "shipping_postal_code": "700000",
  "shipping_country": "Vietnam",
  "payment_method": "vnpay",  // or "banking", "cod"
  "customer_note": "Please deliver in the morning"
}
```

**Response:** Full order details with order_number.

### Cancel Order 🔐
**POST** `/api/orders/{id}/cancel/`

Cancels the order and restores stock for all items.
Only available for orders in 'pending' or 'confirmed' status.

---

## Product Reviews API

### List Reviews
**GET** `/api/reviews/`

**Query Parameters:**
- `product` - Filter by product ID
- `rating` - Filter by rating (1-5)
- `ordering` - Sort by (created_at, -created_at, rating, -rating)

### Get Review Statistics
**GET** `/api/reviews/{product_id}/stats/`

Returns review statistics for a product:
```json
{
  "average_rating": 4.5,
  "total_reviews": 42,
  "five_star": 25,
  "four_star": 10,
  "three_star": 5,
  "two_star": 1,
  "one_star": 1
}
```

### Create Review 🔐
**POST** `/api/reviews/`

**Request Body:**
```json
{
  "product": 1,
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Very comfortable and stylish glasses."
}
```

**Note:** Users can only review each product once.

### Get My Reviews 🔐
**GET** `/api/reviews/my_reviews/`

Returns all reviews created by the current user.

---

## Response Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Error Response Format

```json
{
  "error": "Description of the error",
  "details": {
    "field_name": ["Error message for this field"]
  }
}
```

---

## Smart Cart Merge Flow

**Scenario:** User adds items to cart as guest, then logs in.

1. **Add items as guest** → Items stored in session-based cart
2. **User logs in** → Frontend calls `/api/cart/merge_check/` with guest session_key
3. **Backend checks:**
   - Guest cart empty? → Load user cart
   - User cart empty? → Convert guest cart to user cart
   - Both have items? → Return `MERGE_REQUIRED`
4. **If merge required:**
   - Frontend shows prompt: "Merge or Replace?"
   - User chooses → Frontend calls `/api/cart/merge_confirm/` with action
5. **Backend executes merge** → Returns final merged cart

---

## Notes

🔐 = Requires authentication

All dates are in ISO 8601 format: `2026-01-06T20:30:00+07:00`

All prices are in VND (Vietnamese Dong) as Decimal strings: `"500000.00"`
