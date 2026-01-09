# Tài Liệu Dự Án Thương Mại Điện Tử (Shop Online Example)

## 1. Giới Thiệu (Introduction)

Dự án này là một nền tảng thương mại điện tử hiện đại, full-stack, được xây dựng để cung cấp trải nghiệm mua sắm trực tuyến mượt mà. Hệ thống bao gồm một Backend mạnh mẽ quản lý dữ liệu và logic nghiệp vụ, và một Frontend tương tác cao cho người dùng cuối và quản trị viên.

### Công Nghệ Sử Dụng (Tech Stack)

*   **Backend**: Django (Python) với Django REST Framework (DRF).
*   **Frontend**: Next.js (React) sử dụng App Router.
*   **Database**: PostgreSQL.
*   **Caching & Queue**: Redis & Celery (cho các tác vụ nền như xử lý ảnh, gửi email).
*   **Web Server / Proxy**: Nginx.
*   **Containterization**: Docker & Docker Compose.

## 2. Kiến Trúc Hệ Thống (System Architecture)

Hệ thống được thiết kế theo kiến trúc microservices-lite (các dịch vụ được container hóa riêng biệt nhưng quản lý trong cùng một repo/docker-compose).

### Các Service Chính

1.  **Nginx (Reverse Proxy)**:
    *   Đóng vai trò là cổng vào duy nhất (port 80/443).
    *   Điều hướng request:
        *   `/api/` và `/admin/` -> **Backend Service**.
        *   `/static/` và `/media/` -> Phục vụ file tĩnh trực tiếp.
        *   Các đường dẫn còn lại -> **Frontend Service**.
    *   Quản lý SSL/HTTPS với Certbot.

2.  **Backend (Django API)**:
    *   Cung cấp RESTful API cho Frontend.
    *   Xử lý logic nghiệp vụ: Quản lý sản phẩm, đơn hàng, người dùng, thanh toán.
    *   Giao tiếp với Database và Redis.

3.  **Frontend (Next.js)**:
    *   Server-Side Rendering (SSR) và Client-Side Rendering (CSR).
    *   Giao diện người dùng (Storefront) và trang quản trị (Admin Dashboard).
    *   Gọi API đến Backend để lấy và gửi dữ liệu.

4.  **Database (PostgreSQL)**:
    *   Lưu trữ toàn bộ dữ liệu bền vững của hệ thống (User, Product, Order, v.v.).

5.  **Redis**:
    *   Lưu trữ cache cho API và Frontend.
    *   Message Broker cho Celery (hàng đợi tác vụ).

6.  **Worker (Celery)**:
    *   Xử lý các tác vụ nặng/bất đồng bộ (background tasks) như gửi email, resize ảnh sản phẩm sau khi upload.

### Sơ Đồ Luồng Dữ Liệu (Data Flow)

```mermaid
graph TD
    User[Client / Browser] -->|HTTPS Request| Nginx
    Nginx -->|/api/*| Backend[Django Backend]
    Nginx -->|/*| Frontend[Next.js Frontend]
    Nginx -->|/media/*| Media[Media Files]
    
    Backend -->|Query/Save| DB[(PostgreSQL)]
    Backend -->|Cache/Queue| Redis[(Redis)]
    
    Frontend -->|API Call (Server/Client)| Nginx
    
    Celery[Celery Worker] -->|Consume Task| Redis
    Celery -->|Update DB| DB
```

## 3. Cấu Trúc Thư Mục (Directory Structure)

```
/ (Root)
├── backend/                # Mã nguồn Django Backend
│   ├── apps/               # Các ứng dụng Django (Business Logic)
│   ├── config/             # Cấu hình dự án (Settings, WSGI, ASGI)
│   ├── docker/             # Dockerfile & Entrypoint
│   └── ...
├── frontend/               # Mã nguồn Next.js Frontend
│   ├── app/                # App Router (Pages & Layouts)
│   ├── components/         # Reusable React Components
│   ├── lib/                # Utilities, API Client
│   └── ...
├── nginx/                  # Cấu hình Nginx
├── docker-compose.yml      # Định nghĩa các services Docker
```

## 4. Tài Liệu Backend (Backend Documentation)

Backend được xây dựng bằng Django và Django REST Framework, chia thành các ứng dụng (apps) nhỏ gọn để quản lý từng phần nghiệp vụ.

### Các Ứng Dụng Chính (Apps Overview)

#### 1. Products (`apps.products`)
Quản lý danh mục, sản phẩm, biến thể và media.

*   **Models Chính**:
    *   `Category`: Danh mục sản phẩm đa cấp (có thể có cha-con).
    *   `Product`: Sản phẩm gốc (Base Product), chứa thông tin chung như tên, thương hiệu, mô tả.
    *   `ProductVariant`: Biến thể cụ thể để bán (SKU), chứa màu sắc, size, giá, tồn kho.
        *   Quan hệ: `Product` 1-n `ProductVariant`.
        *   Logic: Giá và tồn kho nằm ở Variant.
    *   `ProductMedia`: Ảnh/Video của sản phẩm, hỗ trợ resize tự động.
    *   `ProductReview`: Đánh giá sản phẩm từ người dùng.

*   **Logic Nghiệp Vụ**:
    *   **SKU Generation**: Tự động tạo SKU dựa trên Tên, Màu, Size.
    *   **Stock Check**: `is_in_stock()` kiểm tra tồn kho của tất cả variant.

#### 2. Users (`apps.users`)
Quản lý người dùng và xác thực.

*   **Models Chính**:
    *   `User`: Mở rộng `AbstractUser` của Django.
        *   Dùng `email` làm định danh đăng nhập (thay vì username).
        *   Lưu thông tin profile: SĐT, Ngày sinh, Avatar.
    *   `UserAddress`: Sổ địa chỉ của người dùng (Nhiều địa chỉ giao hàng).

#### 3. Orders (`apps.orders`)
Quản lý đơn hàng và quy trình xử lý đơn.

*   **Models Chính**:
    *   `Order`: Thông tin đơn hàng (User, Tổng tiền, Trạng thái).
    *   `OrderItem`: Chi tiết sản phẩm trong đơn (Snapshot giá và thông tin tại thời điểm mua).
    *   `OrderStatusHistory`: Lịch sử thay đổi trạng thái đơn hàng.

*   **Quy Trình Trạng Thái (Order Status Workflow)**:
    1.  `PENDING`: Mới tạo, chờ thanh toán/xác nhận.
    2.  `PROCESSING`: Hệ thống đang xử lý, kiểm tra tồn kho.
    3.  `CONFIRMED`: Đã xác nhận, sẵn sàng giao.
    4.  `DELIVERING`: Đang giao hàng.
    5.  `DELIVERED`: Giao thành công.
    6.  `COMPLETED`: Hoàn tất (sau khi hết thời gian đổi trả).
    *   *Các trạng thái khác*: `CANCELED` (Hủy), `REFUNDING/REFUNDED` (Hoàn tiền).

*   **Logic Quan Trọng**:
    *   **Khôi phục tồn kho**: Khi đơn hàng bị Hủy (`CANCELED`) hoặc Hoàn tiền (`REFUNDED`), hệ thống tự động cộng lại tồn kho cho sản phẩm.
    *   **Khóa dòng (Row Locking)**: Sử dụng `select_for_update()` khi cập nhật tồn kho để tránh xung đột (race conditions).

#### 4. Carts (`apps.carts`)
Quản lý giỏ hàng cho cả khách vãng lai (Guest) và User đăng nhập.

*   **Models Chính**:
    *   `Cart`: Giỏ hàng, liên kết với `User` (nếu logged in) hoặc `session_key` (nếu guest).
    *   `CartItem`: Sản phẩm trong giỏ.

*   **Logic Merge Cart**:
    *   Khi khách vãng lai đăng nhập, nếu có giỏ hàng guest và giỏ hàng user cũ, hệ thống sẽ yêu cầu Merge (gộp) hoặc Replace (ghi đè).

### API Endpoints Chính

Chi tiết xem tại `API_DOCUMENT.md`.

*   `GET /api/products/`: Lấy danh sách sản phẩm (Filter, Sort, Search).
*   `GET /api/products/{slug}/`: Chi tiết sản phẩm.
*   `GET /api/cart/`: Lấy giỏ hàng hiện tại.
*   `POST /api/cart/add_item/`: Thêm sản phẩm vào giỏ.
*   `POST /api/orders/create_order/`: Tạo đơn hàng từ giỏ hàng.

## 5. Tài Liệu Frontend (Frontend Documentation)

Frontend được xây dựng bằng **Next.js 14+ (App Router)**, tập trung vào hiệu suất và SEO.

### Cấu Trúc Ứng Dụng (App Structure)

Sử dụng mô hình App Router của Next.js:

*   `app/layout.tsx`: Root Layout, chứa cấu hình font, SEO metadata, và các Provider global (`LayoutWrapper`).
*   `app/page.tsx`: Trang chủ (Homepage).
*   `app/(admin)/`: Route Group cho trang quản trị, có layout riêng.
*   `app/auth/`: Các trang đăng nhập, đăng ký.
*   `app/products/`: Trang danh sách và chi tiết sản phẩm.
*   `app/checkout/`: Trang thanh toán.

### Quản Lý State (State Management)

Dự án sử dụng **Zustand** để quản lý Global State, kết hợp với LocalStorage để persist dữ liệu (như token đăng nhập).

*   **Auth Store (`store/authStore.ts`)**:
    *   Lưu trữ thông tin User và Token.
    *   Tự động đồng bộ Token vào `localStorage` để giữ trạng thái đăng nhập khi F5.
    *   `setAuth(user, token)`: Lưu thông tin khi đăng nhập thành công.
    *   `clearAuth()`: Xóa thông tin khi đăng xuất.

### Tích Hợp API (`lib/api.ts`)

Sử dụng **Axios** được cấu hình sẵn (Interceptor) để xử lý request/response:

1.  **Request Interceptor**:
    *   Tự động đính kèm `Authorization: Token <token>` nếu đã đăng nhập.
    *   Tự động đính kèm `X-CSRFToken` cho các method không an toàn (POST, PUT, DELETE).

2.  **Response Interceptor**:
    *   Tự động xử lý lỗi 401 (Unauthorized): Xóa token và redirect về trang login.

### Các Component Chính

*   `LayoutWrapper`: Bọc nội dung chính, chứa Header và Footer.
*   `TetEffects` & `ScrollBackground`: Các hiệu ứng hình ảnh (theo mùa/sự kiện).

## 6. Các Quy Trình Nghiệp Vụ Chính (Key Workflows)

### 6.1. Quy Trình Xác Thực (Authentication Flow)

1.  **Đăng Nhập**:
    *   User nhập Email/Pass -> Frontend gọi `POST /api/auth/login/`.
    *   Backend trả về `token` và thông tin User.
    *   Frontend lưu `token` vào `authStore` (và localStorage).
    *   Frontend chuyển hướng User về trang chủ hoặc trang trước đó.

2.  **Tự Động Đăng Nhập (Re-hydration)**:
    *   Khi F5, `authStore` đọc token từ localStorage.
    *   Frontend có thể gọi `GET /api/auth/me/` để cập nhật thông tin User mới nhất.

### 6.2. Quy Trình Giỏ Hàng (Shopping Cart Flow)

Đặc biệt hỗ trợ **Smart Cart Merge** (Gộp giỏ hàng):

1.  **Khách Vãng Lai (Guest)**:
    *   Thêm vào giỏ -> Backend tạo Cart gắn với `session_key` (lưu trong cookie).
2.  **Đăng Nhập & Merge**:
    *   Khi User đăng nhập, Frontend gọi `POST /api/cart/merge_check/` gửi kèm `session_key` của Guest.
    *   **Trường hợp 1**: Nếu User chưa có giỏ hàng cũ -> Hệ thống chuyển Giỏ hàng Guest thành Giỏ hàng User.
    *   **Trường hợp 2**: Nếu User đã có giỏ hàng cũ -> Backend trả về `MERGE_REQUIRED`.
        *   Frontend hiện Popup hỏi User: "Bạn muốn Gộp hay Thay thế?".
        *   User chọn -> Gọi `POST /api/cart/merge_confirm/` để thực hiện.

### 6.3. Quy Trình Đặt Hàng (Order Placement)

1.  **Checkout**:
    *   User điền thông tin giao hàng tại `/checkout`.
    *   Chọn phương thức thanh toán (COD, VNPAY, Banking).
2.  **Tạo Đơn**:
    *   Frontend gọi `POST /api/orders/create_order/`.
    *   Backend validate, trừ tồn kho (tạm thời), tạo đơn hàng trạng thái `PENDING`.
3.  **Thanh Toán (Nếu chọn VNPAY)**:
    *   Backend trả về URL thanh toán VNPAY.
    *   Frontend redirect User qua cổng thanh toán.
    *   Sau khi thanh toán, User được redirect về `/checkout/success` hoặc `/checkout/failed`.
    *   Backend nhận IPN (Instant Payment Notification) từ VNPAY để cập nhật trạng thái đơn hàng -> `CONFIRMED` (hoặc `PROCESSING`).

### 6.4. Xử Lý Tồn Kho (Inventory Management)

*   **Trừ tồn kho**: Khi đơn hàng được tạo thành công.
*   **Hoàn tồn kho (Rollback)**:
    *   Khi đơn hàng bị Hủy (`cancelled`) hoặc Hết hạn thanh toán (15 phút).
    *   Kho sẽ tự động được cộng lại đúng số lượng.