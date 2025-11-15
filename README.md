# Glasses Shop - E-Commerce Platform

## Tổng quan dự án (Project Overview)

Dự án Glasses Shop là một nền tảng thương mại điện tử bán kính mắt, được xây dựng theo kiến trúc microservices với:
- **Frontend Admin**: Giao diện quản lý (Next.js)
- **Frontend User**: Giao diện người dùng (Next.js)
- **Backend Microservices**: Các dịch vụ backend (Spring Boot)
- **API Gateway**: Spring Cloud Gateway làm điểm truy cập trung tâm

## Cấu trúc dự án (Project Structure)

```
glassess_shop/
├── admin/                 # Next.js admin dashboard
├── user/                  # Next.js user-facing application
├── gateway/              # Spring Cloud Gateway (to be implemented)
├── services/             # Backend microservices (to be implemented)
│   ├── product-service/
│   ├── order-service/
│   ├── user-service/
│   └── inventory-service/
└── docs/                 # Documentation
    └── SPRING_CLOUD_GATEWAY.md
```

## Kiến trúc hệ thống (System Architecture)

```
┌─────────────┐     ┌─────────────┐
│   Admin     │     │    User     │
│  Frontend   │     │  Frontend   │
│  (Next.js)  │     │  (Next.js)  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │    HTTP/HTTPS     │
       └────────┬──────────┘
                │
        ┌───────▼────────┐
        │  Spring Cloud  │
        │    Gateway     │
        │  (Port 8080)   │
        └───────┬────────┘
                │
    ┌───────────┼───────────┬──────────┐
    │           │           │          │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│Product│  │ Order │  │ User  │  │Invent.│
│Service│  │Service│  │Service│  │Service│
└───────┘  └───────┘  └───────┘  └───────┘
```

## Spring Cloud Gateway

Spring Cloud Gateway là API Gateway được sử dụng trong dự án này để:

1. **Định tuyến thống nhất (Unified Routing)**: Cung cấp một điểm truy cập duy nhất cho tất cả microservices
2. **Bảo mật (Security)**: Xác thực và phân quyền tập trung
3. **Cân bằng tải (Load Balancing)**: Phân phối request đều giữa các instance
4. **Giới hạn tốc độ (Rate Limiting)**: Kiểm soát số lượng request
5. **Giám sát (Monitoring)**: Theo dõi và logging tập trung

### Tài liệu chi tiết

Xem [SPRING_CLOUD_GATEWAY.md](./docs/SPRING_CLOUD_GATEWAY.md) để biết thêm chi tiết về:
- Cấu hình Spring Cloud Gateway
- Routing configuration
- Security implementation
- Circuit breaker patterns
- Monitoring và logging

## Bắt đầu (Getting Started)

### Frontend Applications

#### Admin Dashboard
```bash
cd admin
npm install
npm run dev
# Runs on http://localhost:3000
```

#### User Application
```bash
cd user
npm install
npm run dev
# Runs on http://localhost:3001
```

### Backend Services (Coming soon)

Các microservices backend sẽ được triển khai với Spring Boot và Spring Cloud.

## Công nghệ sử dụng (Technology Stack)

### Frontend
- **Next.js**: React framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework

### Backend (Planned)
- **Spring Boot**: Microservices framework
- **Spring Cloud Gateway**: API Gateway
- **Spring Security**: Authentication & Authorization
- **Spring Data JPA**: Data access layer
- **PostgreSQL/MySQL**: Database
- **Redis**: Caching
- **Eureka**: Service discovery

## API Endpoints

Tất cả API requests sẽ đi qua Spring Cloud Gateway tại: `http://localhost:8080`

### Product Service
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/{id}` - Lấy chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm mới (Admin)
- `PUT /api/products/{id}` - Cập nhật sản phẩm (Admin)
- `DELETE /api/products/{id}` - Xóa sản phẩm (Admin)

### Order Service
- `GET /api/orders` - Lấy danh sách đơn hàng
- `GET /api/orders/{id}` - Lấy chi tiết đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `PUT /api/orders/{id}/status` - Cập nhật trạng thái đơn hàng

### User Service
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `GET /api/users/profile` - Lấy thông tin người dùng
- `PUT /api/users/profile` - Cập nhật thông tin

### Inventory Service
- `GET /api/inventory/{productId}` - Kiểm tra tồn kho
- `PUT /api/inventory/{productId}` - Cập nhật tồn kho (Admin)

## Phát triển (Development)

### Prerequisites
- Node.js 18+
- Java 17+ (for backend)
- Maven 3.6+ (for backend)
- PostgreSQL 14+ (for backend)
- Redis 6+ (for caching)

### Environment Variables

#### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_NAME=Glasses Shop
```

#### Backend Gateway
```env
SERVER_PORT=8080
EUREKA_SERVER_URL=http://localhost:8761/eureka
JWT_SECRET=your-secret-key
```

## Đóng góp (Contributing)

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## License

This project is licensed under the MIT License.

## Liên hệ (Contact)

- Project Link: [https://github.com/vwthu-22/glassess_shop](https://github.com/vwthu-22/glassess_shop)
