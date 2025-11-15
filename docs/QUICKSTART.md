# Quick Start Guide - Spring Cloud Gateway Implementation

## Hướng dẫn triển khai nhanh Spring Cloud Gateway cho Glasses Shop

### Mục lục
1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt Gateway](#cài-đặt-gateway)
3. [Cấu hình cơ bản](#cấu-hình-cơ-bản)
4. [Tạo Microservice mẫu](#tạo-microservice-mẫu)
5. [Testing](#testing)
6. [Next Steps](#next-steps)

## Yêu cầu hệ thống

### Phần mềm cần thiết
- **Java JDK**: 17 hoặc cao hơn
- **Maven**: 3.6.0 hoặc cao hơn
- **Node.js**: 18 hoặc cao hơn (cho frontend)
- **Docker & Docker Compose**: (optional, cho deployment)
- **Redis**: 6.0 hoặc cao hơn
- **PostgreSQL**: 14 hoặc cao hơn

### Kiểm tra cài đặt

```bash
# Check Java
java -version
# Output: openjdk version "17.0.x"

# Check Maven
mvn -version
# Output: Apache Maven 3.x.x

# Check Node.js
node --version
# Output: v18.x.x

# Check Docker
docker --version
docker-compose --version
```

## Cài đặt Gateway

### Bước 1: Tạo Spring Boot Project

Sử dụng Spring Initializr hoặc Maven:

```bash
# Tạo thư mục dự án
mkdir -p /home/runner/work/glassess_shop/glassess_shop/gateway
cd /home/runner/work/glassess_shop/glassess_shop/gateway

# Tạo Maven project structure
mkdir -p src/main/java/com/glassesshop/gateway
mkdir -p src/main/resources
mkdir -p src/test/java/com/glassesshop/gateway
```

### Bước 2: Tạo pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.5</version>
        <relativePath/>
    </parent>
    
    <groupId>com.glassesshop</groupId>
    <artifactId>gateway-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>Gateway Service</name>
    <description>API Gateway for Glasses Shop</description>
    
    <properties>
        <java.version>17</java.version>
        <spring-cloud.version>2022.0.4</spring-cloud.version>
    </properties>
    
    <dependencies>
        <!-- Spring Cloud Gateway -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
        
        <!-- Actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        
        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### Bước 3: Tạo Main Application Class

```java
// File: src/main/java/com/glassesshop/gateway/GatewayApplication.java
package com.glassesshop.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
```

### Bước 4: Cấu hình application.yml (Cơ bản)

```yaml
# File: src/main/resources/application.yml
server:
  port: 8080

spring:
  application:
    name: gateway-service
  
  cloud:
    gateway:
      # Global CORS
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins: 
              - "http://localhost:3000"  # Admin
              - "http://localhost:3001"  # User
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
            allowedHeaders: "*"
      
      # Routes
      routes:
        # Product Service
        - id: product-service
          uri: http://localhost:8081
          predicates:
            - Path=/api/products/**
          filters:
            - RewritePath=/api/products/(?<segment>.*), /${segment}
        
        # User Service
        - id: user-service
          uri: http://localhost:8083
          predicates:
            - Path=/api/users/**,/api/auth/**
          filters:
            - RewritePath=/api/(?<segment>.*), /${segment}

# Actuator
management:
  endpoints:
    web:
      exposure:
        include: health,info,gateway
  endpoint:
    gateway:
      enabled: true

# Logging
logging:
  level:
    root: INFO
    org.springframework.cloud.gateway: DEBUG
```

### Bước 5: Build và Run Gateway

```bash
cd gateway

# Build project
mvn clean package

# Run application
mvn spring-boot:run

# Hoặc run jar file
java -jar target/gateway-service-1.0.0-SNAPSHOT.jar
```

**Kiểm tra Gateway đã chạy:**
```bash
curl http://localhost:8080/actuator/health
# Expected output: {"status":"UP"}

# Xem routes đã cấu hình
curl http://localhost:8080/actuator/gateway/routes | jq
```

## Tạo Microservice mẫu

### Product Service (Port 8081)

#### Tạo project structure

```bash
mkdir -p /home/runner/work/glassess_shop/glassess_shop/services/product-service
cd /home/runner/work/glassess_shop/glassess_shop/services/product-service

mkdir -p src/main/java/com/glassesshop/product
mkdir -p src/main/resources
```

#### pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.5</version>
    </parent>
    
    <groupId>com.glassesshop</groupId>
    <artifactId>product-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    </dependencies>
</project>
```

#### Main Application

```java
// File: src/main/java/com/glassesshop/product/ProductServiceApplication.java
package com.glassesshop.product;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ProductServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}
```

#### Product Model

```java
// File: src/main/java/com/glassesshop/product/model/Product.java
package com.glassesshop.product.model;

public class Product {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private String category;
    
    // Constructor
    public Product(Long id, String name, String description, Double price, String category) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
```

#### Product Controller

```java
// File: src/main/java/com/glassesshop/product/controller/ProductController.java
package com.glassesshop.product.controller;

import com.glassesshop.product.model.Product;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping
public class ProductController {
    
    private List<Product> products = new ArrayList<>();
    
    public ProductController() {
        // Sample data
        products.add(new Product(1L, "Classic Round Glasses", "Timeless round frame glasses", 29.99, "Eyeglasses"));
        products.add(new Product(2L, "Aviator Sunglasses", "Classic aviator style sunglasses", 49.99, "Sunglasses"));
        products.add(new Product(3L, "Blue Light Blocking Glasses", "Protect your eyes from screen", 39.99, "Computer Glasses"));
    }
    
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(products);
    }
    
    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Optional<Product> product = products.stream()
                .filter(p -> p.getId().equals(id))
                .findFirst();
        
        return product.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        product.setId((long) (products.size() + 1));
        products.add(product);
        return ResponseEntity.ok(product);
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Product Service is running!");
    }
}
```

#### application.yml

```yaml
# File: src/main/resources/application.yml
server:
  port: 8081

spring:
  application:
    name: product-service

management:
  endpoints:
    web:
      exposure:
        include: health,info
```

#### Build và Run

```bash
cd services/product-service
mvn clean package
mvn spring-boot:run
```

## Testing

### Test 1: Direct Service Call

```bash
# Test Product Service directly
curl http://localhost:8081/products | jq

# Expected output: Array of products
```

### Test 2: Through Gateway

```bash
# Test through Gateway
curl http://localhost:8080/api/products | jq

# Should return same products array
```

### Test 3: CORS

```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:8080/api/products \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Check for CORS headers in response
```

### Test 4: Gateway Routes

```bash
# List all configured routes
curl http://localhost:8080/actuator/gateway/routes | jq

# Get specific route info
curl http://localhost:8080/actuator/gateway/routes/product-service | jq
```

### Test 5: Create Product through Gateway

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sport Sunglasses",
    "description": "Perfect for outdoor activities",
    "price": 59.99,
    "category": "Sports"
  }' | jq
```

## Tích hợp với Frontend

### Update Frontend Environment Variables

#### Admin Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_API_GATEWAY=http://localhost:8080
```

#### User Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_API_GATEWAY=http://localhost:8080
```

### Sample API Call từ Frontend

```typescript
// File: admin/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const productApi = {
  // Get all products
  getProducts: async () => {
    const response = await fetch(`${API_URL}/api/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },
  
  // Get product by ID
  getProduct: async (id: number) => {
    const response = await fetch(`${API_URL}/api/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },
  
  // Create product
  createProduct: async (product: any) => {
    const response = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
  },
};
```

## Docker Deployment (Optional)

### Gateway Dockerfile

```dockerfile
# File: gateway/Dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/gateway-service-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

### Docker Compose

```yaml
# File: docker-compose.yml (root directory)
version: '3.8'

services:
  gateway:
    build: ./gateway
    container_name: gateway-service
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
    networks:
      - glasses-shop-network

  product-service:
    build: ./services/product-service
    container_name: product-service
    ports:
      - "8081:8081"
    networks:
      - glasses-shop-network

  admin-frontend:
    build: ./admin
    container_name: admin-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://gateway:8080
    networks:
      - glasses-shop-network

  user-frontend:
    build: ./user
    container_name: user-frontend
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://gateway:8080
    networks:
      - glasses-shop-network

networks:
  glasses-shop-network:
    driver: bridge
```

### Run with Docker Compose

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f gateway

# Stop all services
docker-compose down
```

## Next Steps

### 1. Thêm Authentication
- Implement JWT trong Gateway
- Tạo User Service với login/register
- Thêm authentication filter

### 2. Thêm Service Discovery
- Setup Eureka Server
- Register services với Eureka
- Update Gateway để sử dụng service discovery

### 3. Thêm Circuit Breaker
- Thêm Resilience4j dependency
- Cấu hình circuit breaker cho mỗi route
- Implement fallback endpoints

### 4. Thêm Rate Limiting
- Setup Redis
- Cấu hình rate limiting
- Test rate limiting với nhiều requests

### 5. Monitoring & Logging
- Setup ELK Stack hoặc Prometheus/Grafana
- Thêm distributed tracing (Zipkin)
- Configure detailed logging

### 6. Implement các Services còn lại
- Order Service (8082)
- Inventory Service (8084)
- Payment Service (8085)
- Notification Service (8086)

## Troubleshooting

### Gateway không start

```bash
# Check port conflicts
lsof -i :8080

# Check logs
mvn spring-boot:run -X
```

### Không route được đến service

```bash
# Verify service is running
curl http://localhost:8081/health

# Check gateway routes
curl http://localhost:8080/actuator/gateway/routes

# Check gateway logs
tail -f logs/gateway-service.log
```

### CORS errors

Đảm bảo frontend origin được thêm vào allowedOrigins trong gateway configuration.

## Resources

- [Spring Cloud Gateway Docs](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/)
- [Spring Boot Docs](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Project Repository](https://github.com/vwthu-22/glassess_shop)

## Conclusion

Bây giờ bạn đã có:
✅ Spring Cloud Gateway đang chạy trên port 8080
✅ Product Service đang chạy trên port 8081
✅ Gateway routing requests từ frontend đến services
✅ CORS được cấu hình cho frontend
✅ Health checks và monitoring

Tiếp tục với Next Steps để thêm các tính năng advanced hơn!
