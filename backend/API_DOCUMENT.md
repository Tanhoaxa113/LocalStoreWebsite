# Tài Liệu API - Shop Mắt Kính Hàn Quốc

## Base URL
```
http://localhost:8000/api/
```

## Xác Thực (Authentication)
Hầu hết các endpoint sử dụng Token Authentication. Gửi kèm token trong header của request:
```
Authorization: Token <your-token-here>
```

---

## 1. API Sản Phẩm (Products API)

### Lấy Danh Sách Sản Phẩm
**GET** `/api/products/`

**Tham Số Truy Vấn (Query Parameters):**
- `category` - Lọc theo ID danh mục
- `brand` - Lọc theo tên thương hiệu
- `target_gender` - Lọc theo giới tính (unisex, male, female, kids)
- `is_featured` - Lọc sản phẩm nổi bật (true/false)
- `is_new_arrival` - Lọc sản phẩm mới về (true/false)
- `is_best_seller` - Lọc sản phẩm bán chạy (true/false)
- `min_price` - Giá thấp nhất
- `max_price` - Giá cao nhất
- `color` - Lọc theo màu sắc
- `lens_type` - Lọc theo loại tròng kính (clear, prescription, polarized, etc.)
- `material` - Lọc theo chất liệu (acetate, metal, titanium, etc.)
- `size` - Lọc theo kích thước (XS, S, M, L, XL)
- `in_stock` - Lọc theo tình trạng còn hàng (true/false)
- `search` - Tìm kiếm theo tên, thương hiệu, mô tả
- `ordering` - Sắp xếp theo (created_at, -created_at, base_price, -base_price, view_count, -view_count, name, -name)

**Ví dụ:**
```bash
GET /api/products/?category=1&in_stock=true&ordering=-created_at
```

### Lấy Chi Tiết Sản Phẩm
**GET** `/api/products/{slug}/`

Trả về chi tiết đầy đủ của sản phẩm bao gồm tất cả các biến thể và media (ảnh/video).

### Lấy Sản Phẩm Nổi Bật
**GET** `/api/products/featured/`

Trả về top 10 sản phẩm nổi bật.

### Lấy Sản Phẩm Mới Về
**GET** `/api/products/new_arrivals/`

Trả về 10 sản phẩm mới nhất.

### Lấy Sản Phẩm Bán Chạy
**GET** `/api/products/best_sellers/`

Trả về top 10 sản phẩm bán chạy nhất.

### Lấy Sản Phẩm Liên Quan
**GET** `/api/products/{slug}/related/`

Trả về tối đa 6 sản phẩm liên quan cùng danh mục.

---

## 2. API Danh Mục (Categories API)

### Lấy Danh Sách Danh Mục
**GET** `/api/categories/`

**Tham Số Truy Vấn:**
- `parent` - Lọc theo ID danh mục cha (dùng 'null' để lấy danh mục cấp cao nhất)

### Lấy Chi Tiết Danh Mục
**GET** `/api/categories/{slug}/`

---

## 3. API Biến Thể Sản Phẩm (Product Variants API)

### Lấy Danh Sách Biến Thể
**GET** `/api/variants/`

**Tham Số Truy Vấn:**
- `product` - Lọc theo ID sản phẩm
- `product_slug` - Lọc theo slug sản phẩm
- `color` - Màu sắc
- `material` - Chất liệu
- `lens_type` - Loại tròng
- `size` - Kích thước
- `in_stock` - Còn hàng (true/false)

---

## 4. API Giỏ Hàng (Cart API)

### Lấy Giỏ Hàng Hiện Tại
**GET** `/api/cart/`

Trả về giỏ hàng của user hiện tại (hoặc giỏ hàng khách dựa trên session).

**Phản Hồi:**
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

### Thêm Sản Phẩm Vào Giỏ
**POST** `/api/cart/add_item/`

**Body:**
```json
{
  "variant_id": 1,
  "quantity": 1
}
```

Nếu sản phẩm đã có trong giỏ, số lượng sẽ được cộng dồn.

### Cập Nhật Mục Trong Giỏ
**PATCH** `/api/cart/update_item/`

**Body:**
```json
{
  "item_id": 1,
  "quantity": 3
}
```

### Xóa Mục Khỏi Giỏ
**DELETE** `/api/cart/remove_item/`

**Body:**
```json
{
  "item_id": 1
}
```

### Xóa Toàn Bộ Giỏ Hàng
**POST** `/api/cart/clear/`

### Kiểm Tra Gộp Giỏ Hàng (Khi Đăng Nhập) 🔐
**POST** `/api/cart/merge_check/`

**Body:**
```json
{
  "session_key": "guest-session-key"
}
```

**Mã Phản Hồi:**
- `MERGE_REQUIRED` - Cả giỏ hàng khách và giỏ hàng user đều có item -> Cần hỏi user.
- `CART_LOADED` - Đã tự động load giỏ hàng (do tự gộp hoặc chỉ có 1 giỏ hàng).

**Ví dụ Phản Hồi (Cần Gộp):**
```json
{
  "code": "MERGE_REQUIRED",
  "message": "Bạn có sản phẩm trong cả giỏ hàng khách và giỏ hàng đã lưu. Bạn có muốn gộp chúng không?",
  "guest_cart": {...},
  "user_cart": {...}
}
```

### Xác Nhận Gộp Giỏ Hàng 🔐
**POST** `/api/cart/merge_confirm/`

**Body:**
```json
{
  "session_key": "guest-session-key",
  "action": "merge"  // hoặc "replace"
}
```
- `merge` - Gộp giỏ khách + giỏ user.
- `replace` - Bỏ giỏ khách, chỉ giữ giỏ user.

---

## 5. API Đơn Hàng (Orders API)

### Lấy Danh Sách Đơn Hàng Của Tôi 🔐
**GET** `/api/orders/`

### Lấy Chi Tiết Đơn Hàng 🔐
**GET** `/api/orders/{id}/`

### Tạo Đơn Hàng Từ Giỏ Hàng 🔐
**POST** `/api/orders/create_order/`

**Body:**
```json
{
  "email": "customer@example.com",
  "phone": "+84909123456",
  "shipping_full_name": "Nguyen Van A",
  "shipping_phone": "+84909123456",
  "shipping_address_line1": "123 Đường Lê Lợi",
  "shipping_address_line2": "Căn hộ 5B",
  "shipping_ward": "Phường Bến Nghé",
  "shipping_district": "Quận 1",
  "shipping_city": "TP. Hồ Chí Minh",
  "shipping_postal_code": "700000",
  "shipping_country": "Vietnam",
  "payment_method": "vnpay",  // hoặc "banking", "cod"
  "customer_note": "Giao hàng vào buổi sáng"
}
```

### Hủy Đơn Hàng 🔐
**POST** `/api/orders/{id}/cancel/`

Hủy đơn hàng và hoàn lại tồn kho. Chỉ áp dụng cho đơn hàng ở trạng thái 'pending' hoặc 'confirmed'.

---

## 6. API Đánh Giá (Reviews API)

### Lấy Danh Sách Đánh Giá
**GET** `/api/reviews/`

**Tham Số Truy Vấn:**
- `product` - ID sản phẩm
- `rating` - Số sao (1-5)
- `ordering` - Sắp xếp

### Lấy Thống Kê Đánh Giá
**GET** `/api/reviews/{product_id}/stats/`

### Viết Đánh Giá 🔐
**POST** `/api/reviews/`

**Body:**
```json
{
  "product": 1,
  "rating": 5,
  "title": "Sản phẩm tuyệt vời!",
  "comment": "Rất thoải mái và thời trang."
}
```
Mỗi user chỉ được đánh giá 1 lần cho mỗi sản phẩm.

### Lấy Đánh Giá Của Tôi 🔐
**GET** `/api/reviews/my_reviews/`

---

## Mã Phản Hồi (Response Codes)

- `200 OK` - Thành công
- `201 Created` - Tạo mới thành công
- `400 Bad Request` - Dữ liệu đầu vào không hợp lệ
- `401 Unauthorized` - Cần đăng nhập
- `403 Forbidden` - Không có quyền truy cập
- `404 Not Found` - Không tìm thấy tài nguyên
- `500 Internal Server Error` - Lỗi server

## Định Dạng Lỗi (Error Format)

```json
{
  "error": "Mô tả lỗi chung",
  "details": {
    "field_name": ["Thông báo lỗi cụ thể cho trường này"]
  }
}
```

## Ghi Chú

🔐 = Yêu cầu đăng nhập (Authentication required)
Ngày tháng: Định dạng ISO 8601 (`2026-01-06T20:30:00+07:00`)
Giá tiền: VND, dạng string (`"500000.00"`)
