# Kiến trúc Microservices với Spring Cloud Gateway

## Tổng quan kiến trúc (Architecture Overview)

### Sơ đồ kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / Users                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     Load Balancer (Nginx)                       │
│                    SSL Termination Point                        │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             │ HTTP                       │ HTTP
             │                            │
┌────────────▼───────────┐    ┌──────────▼────────────┐
│   Admin Frontend       │    │   User Frontend       │
│   (Next.js - 3000)     │    │   (Next.js - 3001)    │
│   - Product Management │    │   - Browse Products   │
│   - Order Management   │    │   - Shopping Cart     │
│   - User Management    │    │   - Checkout          │
│   - Analytics          │    │   - User Profile      │
└────────────┬───────────┘    └──────────┬────────────┘
             │                           │
             │ API Calls                 │ API Calls
             │ (JWT Token)               │ (JWT Token)
             └───────────┬───────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  Spring Cloud Gateway (8080)                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Request Routing & Filtering                  │ │
│  │  - JWT Authentication                                     │ │
│  │  - Rate Limiting (Redis)                                  │ │
│  │  - Request/Response Logging                               │ │
│  │  - CORS Handling                                          │ │
│  │  - Circuit Breaker (Resilience4j)                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────┬────────┬────────┬────────┬────────┬────────────────┬─────┘
      │        │        │        │        │                │
      │        │        │        │        │                │
┌─────▼────┐┌──▼─────┐┌─▼──────┐┌▼──────┐┌▼────────┐ ┌───▼─────┐
│ Product  ││ Order  ││  User  ││Invent.││ Payment │ │ Notif.  │
│ Service  ││Service ││Service ││Service││ Service │ │ Service │
│  (8081)  ││ (8082) ││ (8083) ││(8084) ││  (8085) │ │ (8086)  │
└─────┬────┘└──┬─────┘└─┬──────┘└┬──────┘└┬────────┘ └───┬─────┘
      │        │        │        │        │              │
      └────────┴────────┴────────┴────────┴──────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                   Service Discovery Layer                       │
│                 Eureka Server (8761)                            │
│  - Service Registration                                         │
│  - Health Checking                                              │
│  - Load Balancing                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      Data Layer                                 │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │    Redis     │  │   MongoDB    │         │
│  │              │  │              │  │              │         │
│  │  - Users     │  │  - Cache     │  │  - Logs      │         │
│  │  - Products  │  │  - Sessions  │  │  - Analytics │         │
│  │  - Orders    │  │  - Rate Limit│  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Chi tiết các thành phần (Component Details)

### 1. Frontend Layer

#### Admin Frontend (Port 3000)
**Công nghệ:** Next.js, TypeScript, Tailwind CSS

**Chức năng chính:**
- Dashboard với thống kê tổng quan
- Quản lý sản phẩm (CRUD operations)
- Quản lý đơn hàng
- Quản lý người dùng
- Quản lý kho hàng
- Báo cáo và phân tích

**API Endpoints sử dụng:**
```
GET    /api/products        - Danh sách sản phẩm
POST   /api/products        - Tạo sản phẩm mới
PUT    /api/products/:id    - Cập nhật sản phẩm
DELETE /api/products/:id    - Xóa sản phẩm
GET    /api/orders          - Danh sách đơn hàng
PUT    /api/orders/:id      - Cập nhật trạng thái đơn hàng
GET    /api/users           - Danh sách người dùng
GET    /api/analytics       - Dữ liệu phân tích
```

#### User Frontend (Port 3001)
**Công nghệ:** Next.js, TypeScript, Tailwind CSS

**Chức năng chính:**
- Trang chủ với sản phẩm nổi bật
- Danh sách sản phẩm với bộ lọc
- Chi tiết sản phẩm
- Giỏ hàng
- Checkout
- Quản lý tài khoản người dùng
- Lịch sử đơn hàng

**API Endpoints sử dụng:**
```
GET  /api/products          - Danh sách sản phẩm
GET  /api/products/:id      - Chi tiết sản phẩm
POST /api/auth/register     - Đăng ký tài khoản
POST /api/auth/login        - Đăng nhập
GET  /api/users/profile     - Thông tin người dùng
POST /api/orders            - Tạo đơn hàng
GET  /api/orders/:id        - Chi tiết đơn hàng
POST /api/payment           - Thanh toán
```

### 2. API Gateway Layer

#### Spring Cloud Gateway (Port 8080)

**Routing Configuration:**

```yaml
# Product Service Routes
/api/products/** → lb://product-service:8081

# Order Service Routes  
/api/orders/** → lb://order-service:8082

# User Service Routes
/api/users/** → lb://user-service:8083
/api/auth/** → lb://user-service:8083

# Inventory Service Routes
/api/inventory/** → lb://inventory-service:8084

# Payment Service Routes
/api/payment/** → lb://payment-service:8085

# Notification Service Routes
/api/notifications/** → lb://notification-service:8086
```

**Global Filters:**
1. **Authentication Filter**
   - Xác thực JWT token
   - Skip cho public endpoints (/api/auth/login, /api/auth/register)
   - Thêm user info vào request headers

2. **Logging Filter**
   - Log tất cả requests/responses
   - Track request duration
   - Generate request ID

3. **Rate Limiting Filter**
   - Giới hạn số requests per user/IP
   - Sử dụng Redis để tracking
   - Response với 429 khi vượt limit

4. **Circuit Breaker Filter**
   - Theo dõi service health
   - Fallback khi service down
   - Auto recovery

### 3. Microservices Layer

#### Product Service (Port 8081)

**Trách nhiệm:**
- Quản lý thông tin sản phẩm
- Tìm kiếm và lọc sản phẩm
- Quản lý danh mục sản phẩm
- Upload và quản lý hình ảnh

**Database:** PostgreSQL
```sql
Tables:
- products (id, name, description, price, category_id, created_at)
- categories (id, name, description)
- product_images (id, product_id, image_url, is_primary)
- product_attributes (id, product_id, attribute_name, attribute_value)
```

**APIs:**
```
GET    /products           - List products with pagination
GET    /products/:id       - Get product details
POST   /products           - Create product (Admin)
PUT    /products/:id       - Update product (Admin)
DELETE /products/:id       - Delete product (Admin)
GET    /categories         - List categories
POST   /categories         - Create category (Admin)
```

#### Order Service (Port 8082)

**Trách nhiệm:**
- Tạo và quản lý đơn hàng
- Theo dõi trạng thái đơn hàng
- Tính toán tổng tiền
- Tích hợp với payment service

**Database:** PostgreSQL
```sql
Tables:
- orders (id, user_id, total_amount, status, created_at)
- order_items (id, order_id, product_id, quantity, price)
- order_history (id, order_id, status, changed_at, notes)
```

**APIs:**
```
GET  /orders            - List orders
GET  /orders/:id        - Get order details
POST /orders            - Create order
PUT  /orders/:id/status - Update order status (Admin)
GET  /orders/user/:id   - Get user orders
```

#### User Service (Port 8083)

**Trách nhiệm:**
- Quản lý tài khoản người dùng
- Xác thực và phân quyền
- Quản lý profile
- JWT token generation

**Database:** PostgreSQL
```sql
Tables:
- users (id, email, password_hash, full_name, phone, role)
- user_addresses (id, user_id, address_line, city, postal_code)
- user_sessions (id, user_id, token, expires_at)
```

**APIs:**
```
POST /auth/register     - Register new user
POST /auth/login        - Login user
POST /auth/logout       - Logout user
GET  /users/profile     - Get user profile
PUT  /users/profile     - Update user profile
POST /users/addresses   - Add address
```

#### Inventory Service (Port 8084)

**Trách nhiệm:**
- Quản lý tồn kho
- Cập nhật số lượng khi có đơn hàng
- Cảnh báo hết hàng
- Kiểm tra availability

**Database:** PostgreSQL
```sql
Tables:
- inventory (id, product_id, quantity, reserved_quantity)
- inventory_transactions (id, product_id, type, quantity, created_at)
```

**APIs:**
```
GET  /inventory/:productId           - Check product availability
PUT  /inventory/:productId           - Update stock (Admin)
POST /inventory/reserve              - Reserve stock for order
POST /inventory/release              - Release reserved stock
GET  /inventory/low-stock            - Get low stock products
```

#### Payment Service (Port 8085)

**Trách nhiệm:**
- Xử lý thanh toán
- Tích hợp payment gateways (VNPay, MoMo, etc.)
- Refund handling
- Payment history

**Database:** PostgreSQL
```sql
Tables:
- payments (id, order_id, amount, method, status, transaction_id)
- payment_gateways (id, name, config)
- refunds (id, payment_id, amount, reason, status)
```

**APIs:**
```
POST /payment/create          - Create payment
GET  /payment/:id             - Get payment status
POST /payment/callback        - Payment gateway callback
POST /payment/refund          - Process refund
```

#### Notification Service (Port 8086)

**Trách nhiệm:**
- Gửi email notifications
- SMS notifications
- Push notifications
- Notification templates

**Database:** MongoDB (cho logs và templates)

**APIs:**
```
POST /notifications/email     - Send email
POST /notifications/sms       - Send SMS
GET  /notifications/user/:id  - Get user notifications
PUT  /notifications/:id/read  - Mark as read
```

### 4. Service Discovery

#### Eureka Server (Port 8761)

**Chức năng:**
- Service registration
- Service discovery
- Health checking
- Load balancing metadata

**Registered Services:**
```
- gateway-service
- product-service
- order-service
- user-service
- inventory-service
- payment-service
- notification-service
```

### 5. Data Layer

#### PostgreSQL
**Databases:**
- `glassesshop_products` - Product catalog
- `glassesshop_orders` - Orders and transactions
- `glassesshop_users` - User accounts
- `glassesshop_inventory` - Inventory management
- `glassesshop_payments` - Payment records

#### Redis
**Usage:**
- Session storage
- Rate limiting counters
- Response caching
- Distributed locks

**Key Patterns:**
```
session:{userId}              - User sessions
ratelimit:{userId}:{endpoint} - Rate limit counters
cache:product:{productId}     - Product cache
cache:inventory:{productId}   - Inventory cache
lock:order:{orderId}          - Order processing locks
```

#### MongoDB
**Collections:**
- `audit_logs` - System audit trails
- `notification_logs` - Notification history
- `analytics_events` - User behavior analytics
- `search_history` - Product search logs

## Request Flow Examples

### 1. User Authentication Flow

```
1. User submits login credentials
   Browser → User Frontend → POST /api/auth/login

2. Frontend forwards to Gateway
   User Frontend → Gateway (8080) → /api/auth/login

3. Gateway routes to User Service
   Gateway → User Service (8083) → POST /auth/login

4. User Service validates credentials
   - Query user from database
   - Verify password hash
   - Generate JWT token

5. Return JWT token
   User Service → Gateway → User Frontend → Browser

6. Store token in localStorage/cookie
   Frontend saves token for future requests
```

### 2. Product Browse Flow

```
1. User visits product page
   Browser → User Frontend → GET /products?page=1&limit=20

2. Frontend calls Gateway
   User Frontend → Gateway (8080) → GET /api/products?page=1&limit=20

3. Gateway checks cache (Redis)
   Gateway → Redis → Check cache key "products:page:1:limit:20"

4. If cache miss, route to Product Service
   Gateway → Product Service (8081) → GET /products?page=1&limit=20

5. Product Service queries database
   Product Service → PostgreSQL → SELECT * FROM products

6. Cache and return response
   Product Service → Gateway → Update Redis cache → User Frontend
```

### 3. Order Creation Flow

```
1. User submits order
   Browser → User Frontend → POST /api/orders
   Body: { items: [...], address_id: 1 }

2. Gateway authenticates request
   - Extract JWT from Authorization header
   - Validate token
   - Extract user_id

3. Gateway routes to Order Service
   Gateway → Order Service (8082) → POST /orders

4. Order Service orchestrates:
   a) Check inventory
      Order Service → Inventory Service (8084)
      → GET /inventory/check { product_ids, quantities }
   
   b) Reserve inventory
      Order Service → Inventory Service
      → POST /inventory/reserve { order_id, items }
   
   c) Create order record
      Order Service → PostgreSQL
      → INSERT INTO orders, order_items
   
   d) Initiate payment
      Order Service → Payment Service (8085)
      → POST /payment/create { order_id, amount }

5. Return order details
   Order Service → Gateway → User Frontend → Browser
   Response: { order_id, payment_url, status }
```

### 4. Admin Product Update Flow

```
1. Admin updates product
   Browser → Admin Frontend → PUT /api/products/123
   Headers: { Authorization: "Bearer admin_jwt_token" }

2. Gateway authenticates and authorizes
   - Validate JWT
   - Check role = "ADMIN"
   - Add X-User-Role header

3. Gateway routes to Product Service
   Gateway → Product Service (8081) → PUT /products/123

4. Product Service updates database
   Product Service → PostgreSQL → UPDATE products WHERE id=123

5. Invalidate cache
   Product Service → Redis → DELETE cache:product:123

6. Return success response
   Product Service → Gateway → Admin Frontend → Browser
```

## Security Considerations

### 1. Authentication & Authorization

**JWT Token Structure:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "USER|ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Access Control:**
```
Public Endpoints (No Auth):
- POST /api/auth/login
- POST /api/auth/register
- GET  /api/products
- GET  /api/products/:id

User Endpoints (Auth Required):
- GET    /api/users/profile
- PUT    /api/users/profile
- POST   /api/orders
- GET    /api/orders/:id

Admin Endpoints (Admin Role):
- POST   /api/products
- PUT    /api/products/:id
- DELETE /api/products/:id
- GET    /api/orders (all orders)
- PUT    /api/inventory/:id
```

### 2. Rate Limiting

**Limits by Endpoint:**
```
Public Endpoints:
- 100 requests per minute per IP

Authenticated Endpoints:
- 1000 requests per minute per user

Admin Endpoints:
- Unlimited
```

### 3. Data Encryption

- All passwords hashed with BCrypt
- Sensitive data encrypted at rest
- HTTPS for all communications
- JWT tokens signed with secret key

## Monitoring & Observability

### Metrics Collection

**Gateway Metrics:**
- Request count by endpoint
- Request duration percentiles
- Error rate by service
- Circuit breaker status

**Service Metrics:**
- Response times
- Database query performance
- Cache hit/miss rates
- Error rates

### Logging Strategy

**Log Levels:**
- ERROR: Service errors, exceptions
- WARN: Circuit breaker activations, rate limits
- INFO: Request/response summaries
- DEBUG: Detailed request data

**Centralized Logging:**
All services send logs to ELK Stack (Elasticsearch, Logstash, Kibana)

### Distributed Tracing

Using Spring Cloud Sleuth + Zipkin:
- Track requests across services
- Identify bottlenecks
- Debug complex flows

## Scalability Considerations

### Horizontal Scaling

**Services that can scale:**
- Gateway: Multiple instances behind load balancer
- Product Service: Read replicas for queries
- Order Service: Stateless processing
- User Service: Session in Redis

**Database Scaling:**
- PostgreSQL: Read replicas for read-heavy tables
- Redis: Redis Cluster for high availability
- MongoDB: Sharding for large collections

### Caching Strategy

**Cache Levels:**
1. Browser Cache: Static assets
2. CDN Cache: Product images
3. Redis Cache: API responses
4. Database Query Cache: Frequently accessed data

**Cache Invalidation:**
- Time-based: TTL for product lists (5 minutes)
- Event-based: Invalidate on product updates
- Manual: Admin can clear specific caches

## Deployment Strategy

### Blue-Green Deployment

```
1. Deploy new version to "green" environment
2. Run smoke tests on green
3. Switch traffic from blue to green
4. Monitor for issues
5. Rollback to blue if needed
6. Keep blue as backup for 24 hours
```

### Rolling Updates

```
1. Update 1 instance at a time
2. Wait for health check to pass
3. Continue to next instance
4. Monitor error rates throughout
```

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Daily full backup
- Hourly incremental backup
- Cross-region replication

**Configuration Backups:**
- Git repository for all configs
- Versioned in repository
- Automated restore scripts

### Failover Procedures

**Service Failure:**
- Circuit breaker activates
- Requests routed to fallback
- Alerts sent to ops team

**Database Failure:**
- Automatic failover to replica
- Read-only mode if needed
- Restore from backup

## Cost Optimization

### Resource Allocation

**Production Environment:**
```
Gateway:       2 vCPU, 4GB RAM (3 instances)
Product:       2 vCPU, 4GB RAM (2 instances)
Order:         2 vCPU, 4GB RAM (2 instances)
User:          2 vCPU, 4GB RAM (2 instances)
Inventory:     1 vCPU, 2GB RAM (2 instances)
Payment:       1 vCPU, 2GB RAM (2 instances)
Notification:  1 vCPU, 2GB RAM (1 instance)
```

**Database:**
```
PostgreSQL: 4 vCPU, 16GB RAM
Redis:      2 vCPU, 8GB RAM
MongoDB:    2 vCPU, 8GB RAM
```

### Auto-scaling Rules

```
Scale Up when:
- CPU > 70% for 5 minutes
- Request queue > 100

Scale Down when:
- CPU < 30% for 15 minutes
- Request queue < 20
```

## Conclusion

Kiến trúc microservices với Spring Cloud Gateway cung cấp:
- ✅ Khả năng mở rộng cao
- ✅ Fault tolerance tốt
- ✅ Dễ dàng maintain và deploy
- ✅ Performance cao với caching
- ✅ Security tập trung
- ✅ Monitoring và observability tốt

Đây là foundation vững chắc cho việc phát triển và mở rộng hệ thống Glasses Shop trong tương lai.
