# Spring Cloud Gateway - Chi tiết Triển khai

## Mục lục
1. [Giới thiệu](#giới-thiệu)
2. [Kiến trúc](#kiến-trúc)
3. [Cấu hình Gateway](#cấu-hình-gateway)
4. [Routing và Predicates](#routing-và-predicates)
5. [Filters](#filters)
6. [Security](#security)
7. [Rate Limiting](#rate-limiting)
8. [Circuit Breaker](#circuit-breaker)
9. [Monitoring và Logging](#monitoring-và-logging)
10. [Deployment](#deployment)

## Giới thiệu

Spring Cloud Gateway là một API Gateway được xây dựng trên Spring Framework 5, Project Reactor và Spring Boot 2.0. Nó cung cấp một cách đơn giản nhưng hiệu quả để định tuyến đến APIs và cung cấp các concerns cross-cutting như: security, monitoring/metrics, và resiliency.

### Tại sao sử dụng Spring Cloud Gateway?

1. **Non-blocking I/O**: Built trên Reactor và Netty, cung cấp hiệu suất cao
2. **Route Predicates**: Định tuyến linh hoạt dựa trên nhiều tiêu chí
3. **Filters**: Xử lý request/response tại một điểm tập trung
4. **Integration**: Tích hợp tốt với Spring ecosystem
5. **Resilience**: Hỗ trợ circuit breaker, retry, rate limiting

## Kiến trúc

### Flow Diagram

```
Client Request
     │
     ▼
┌─────────────────────────────────────────┐
│     Spring Cloud Gateway                │
│                                         │
│  ┌────────────────────────────────┐   │
│  │   Route Predicates             │   │
│  │   - Path, Method, Header...    │   │
│  └──────────┬─────────────────────┘   │
│             │                          │
│             ▼                          │
│  ┌────────────────────────────────┐   │
│  │   Gateway Filters              │   │
│  │   - Authentication             │   │
│  │   - Rate Limiting              │   │
│  │   - Circuit Breaker            │   │
│  │   - Request/Response Transform │   │
│  └──────────┬─────────────────────┘   │
│             │                          │
└─────────────┼──────────────────────────┘
              │
              ▼
       Target Microservice
```

### Các thành phần chính

1. **Route**: Định nghĩa về đích đến và điều kiện để route request
2. **Predicate**: Điều kiện để match request (path, method, header...)
3. **Filter**: Xử lý request/response trước và sau khi routing
4. **Handler**: Xử lý việc gửi request đến đích

## Cấu hình Gateway

### 1. Dependencies (pom.xml)

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
    <artifactId>gateway-service</artifactId>
    <version>1.0.0</version>
    <name>Gateway Service</name>
    
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
        
        <!-- Service Discovery -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
        
        <!-- Circuit Breaker -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-circuitbreaker-reactor-resilience4j</artifactId>
        </dependency>
        
        <!-- Redis for Rate Limiting -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
        </dependency>
        
        <!-- Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        
        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.11.5</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Actuator for Monitoring -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        
        <!-- Micrometer for Metrics -->
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-registry-prometheus</artifactId>
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

### 2. Application Configuration (application.yml)

```yaml
server:
  port: 8080

spring:
  application:
    name: gateway-service
  
  cloud:
    gateway:
      # Global CORS Configuration
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins:
              - "http://localhost:3000"  # Admin frontend
              - "http://localhost:3001"  # User frontend
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            allowedHeaders: "*"
            allowCredentials: true
            maxAge: 3600
      
      # Route Definitions
      routes:
        # Product Service Routes
        - id: product-service
          uri: lb://product-service
          predicates:
            - Path=/api/products/**
          filters:
            - name: CircuitBreaker
              args:
                name: productServiceCircuitBreaker
                fallbackUri: forward:/fallback/products
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
                redis-rate-limiter.requestedTokens: 1
            - RewritePath=/api/products/(?<segment>.*), /${segment}
            - AddRequestHeader=X-Gateway-Request, GatewayRequest
        
        # Order Service Routes
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - name: CircuitBreaker
              args:
                name: orderServiceCircuitBreaker
                fallbackUri: forward:/fallback/orders
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
            - RewritePath=/api/orders/(?<segment>.*), /${segment}
            - name: Retry
              args:
                retries: 3
                statuses: BAD_GATEWAY,GATEWAY_TIMEOUT
                methods: GET
                backoff:
                  firstBackoff: 50ms
                  maxBackoff: 500ms
        
        # User Service Routes
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**,/api/auth/**
          filters:
            - RewritePath=/api/(?<segment>.*), /${segment}
            - name: CircuitBreaker
              args:
                name: userServiceCircuitBreaker
                fallbackUri: forward:/fallback/users
        
        # Inventory Service Routes
        - id: inventory-service
          uri: lb://inventory-service
          predicates:
            - Path=/api/inventory/**
          filters:
            - RewritePath=/api/inventory/(?<segment>.*), /${segment}
            - name: CircuitBreaker
              args:
                name: inventoryServiceCircuitBreaker
                fallbackUri: forward:/fallback/inventory
      
      # Default Filters (Applied to all routes)
      default-filters:
        - name: Retry
          args:
            retries: 3
            statuses: BAD_GATEWAY
        - AddResponseHeader=X-Response-Time, LocalDateTime.now()
  
  # Redis Configuration for Rate Limiting
  redis:
    host: localhost
    port: 6379
    password: ${REDIS_PASSWORD:}
    
# Eureka Client Configuration
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
    registerWithEureka: true
    fetchRegistry: true
  instance:
    preferIpAddress: true
    instance-id: ${spring.application.name}:${spring.application.instance_id:${random.value}}

# Resilience4j Circuit Breaker Configuration
resilience4j:
  circuitbreaker:
    instances:
      productServiceCircuitBreaker:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 10s
        failureRateThreshold: 50
        eventConsumerBufferSize: 10
      orderServiceCircuitBreaker:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 10s
        failureRateThreshold: 50
      userServiceCircuitBreaker:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 10s
        failureRateThreshold: 50
      inventoryServiceCircuitBreaker:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 10s
        failureRateThreshold: 50
  
  # Retry Configuration
  retry:
    instances:
      default:
        maxAttempts: 3
        waitDuration: 1s
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2

# Actuator Configuration for Monitoring
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,gateway
  endpoint:
    health:
      show-details: always
    gateway:
      enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
    distribution:
      percentiles-histogram:
        http.server.requests: true

# Logging Configuration
logging:
  level:
    root: INFO
    org.springframework.cloud.gateway: DEBUG
    org.springframework.cloud.gateway.route.RouteDefinitionLocator: INFO
    reactor.netty: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/gateway-service.log

# JWT Configuration
jwt:
  secret: ${JWT_SECRET:YourSuperSecretKeyForJWTTokenGenerationAndValidation}
  expiration: 86400000 # 24 hours in milliseconds
```

### 3. Main Application Class

```java
package com.glassesshop.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class GatewayServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayServiceApplication.class, args);
    }
}
```

## Routing và Predicates

### Route Predicates

Spring Cloud Gateway hỗ trợ nhiều loại predicates để match requests:

#### 1. Path Predicate
```yaml
predicates:
  - Path=/api/products/**
```

#### 2. Method Predicate
```yaml
predicates:
  - Path=/api/products/**
  - Method=GET,POST
```

#### 3. Header Predicate
```yaml
predicates:
  - Header=X-Request-Id, \d+
```

#### 4. Query Parameter Predicate
```yaml
predicates:
  - Query=category, glasses
```

#### 5. Host Predicate
```yaml
predicates:
  - Host=**.glassesshop.com
```

#### 6. Cookie Predicate
```yaml
predicates:
  - Cookie=session, [a-z]+
```

### Custom Route Configuration

```java
package com.glassesshop.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRoutesConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Product Service with custom filters
                .route("product-service-custom", r -> r
                        .path("/api/products/**")
                        .and()
                        .method("GET")
                        .filters(f -> f
                                .rewritePath("/api/products/(?<segment>.*)", "/${segment}")
                                .addRequestHeader("X-Gateway-Route", "product-service")
                                .circuitBreaker(config -> config
                                        .setName("productCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/products"))
                        )
                        .uri("lb://product-service"))
                
                // Admin routes with authentication
                .route("admin-routes", r -> r
                        .path("/api/admin/**")
                        .and()
                        .header("Authorization", "Bearer .*")
                        .filters(f -> f
                                .rewritePath("/api/admin/(?<segment>.*)", "/${segment}")
                                .addRequestHeader("X-User-Role", "ADMIN")
                        )
                        .uri("lb://admin-service"))
                
                // Public routes without authentication
                .route("public-routes", r -> r
                        .path("/api/public/**")
                        .filters(f -> f
                                .rewritePath("/api/public/(?<segment>.*)", "/${segment}")
                                .addRequestHeader("X-Request-Type", "PUBLIC")
                        )
                        .uri("lb://product-service"))
                
                .build();
    }
}
```

## Filters

### 1. Global Filters

```java
package com.glassesshop.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String requestPath = exchange.getRequest().getPath().toString();
        String requestMethod = exchange.getRequest().getMethod().toString();
        
        logger.info("Gateway Request: {} {} at {}", 
                    requestMethod, requestPath, LocalDateTime.now());
        
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            int statusCode = exchange.getResponse().getStatusCode().value();
            logger.info("Gateway Response: Status {} for {} {} at {}", 
                        statusCode, requestMethod, requestPath, LocalDateTime.now());
        }));
    }

    @Override
    public int getOrder() {
        return -1; // Execute before other filters
    }
}
```

### 2. Request ID Filter

```java
package com.glassesshop.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class RequestIdFilter implements GlobalFilter, Ordered {

    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String requestId = request.getHeaders().getFirst(REQUEST_ID_HEADER);
        
        if (requestId == null || requestId.isEmpty()) {
            requestId = UUID.randomUUID().toString();
        }
        
        ServerHttpRequest modifiedRequest = request.mutate()
                .header(REQUEST_ID_HEADER, requestId)
                .build();
        
        exchange.getResponse().getHeaders().add(REQUEST_ID_HEADER, requestId);
        
        return chain.filter(exchange.mutate().request(modifiedRequest).build());
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
```

### 3. Custom Gateway Filter Factory

```java
package com.glassesshop.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class CustomHeaderGatewayFilterFactory 
        extends AbstractGatewayFilterFactory<CustomHeaderGatewayFilterFactory.Config> {

    public CustomHeaderGatewayFilterFactory() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            exchange.getRequest().mutate()
                    .header(config.getHeaderName(), config.getHeaderValue())
                    .build();
            
            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                exchange.getResponse().getHeaders()
                        .add("X-Custom-Response", "Processed");
            }));
        };
    }

    public static class Config {
        private String headerName;
        private String headerValue;

        public String getHeaderName() {
            return headerName;
        }

        public void setHeaderName(String headerName) {
            this.headerName = headerName;
        }

        public String getHeaderValue() {
            return headerValue;
        }

        public void setHeaderValue(String headerValue) {
            this.headerValue = headerValue;
        }
    }
}
```

## Security

### 1. JWT Authentication Filter

```java
package com.glassesshop.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtAuthenticationFilter implements GatewayFilter {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        // Skip authentication for public endpoints
        if (isPublicEndpoint(request.getPath().toString())) {
            return chain.filter(exchange);
        }
        
        // Check if Authorization header exists
        if (!request.getHeaders().containsKey("Authorization")) {
            return onError(exchange, "Missing authorization header", HttpStatus.UNAUTHORIZED);
        }
        
        String authHeader = request.getHeaders().getFirst("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return onError(exchange, "Invalid authorization header", HttpStatus.UNAUTHORIZED);
        }
        
        String token = authHeader.substring(7);
        
        try {
            Claims claims = validateToken(token);
            
            // Add user information to request headers
            ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-User-Role", claims.get("role", String.class))
                    .header("X-User-Email", claims.get("email", String.class))
                    .build();
            
            return chain.filter(exchange.mutate().request(modifiedRequest).build());
            
        } catch (Exception e) {
            return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }
    }

    private Claims validateToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private boolean isPublicEndpoint(String path) {
        return path.contains("/api/auth/login") ||
               path.contains("/api/auth/register") ||
               path.contains("/api/public/");
    }

    private Mono<Void> onError(ServerWebExchange exchange, String error, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        response.getHeaders().add("Content-Type", "application/json");
        
        String errorResponse = String.format("{\"error\": \"%s\"}", error);
        return response.writeWith(Mono.just(response.bufferFactory()
                .wrap(errorResponse.getBytes(StandardCharsets.UTF_8))));
    }
}
```

### 2. Security Configuration

```java
package com.glassesshop.gateway.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf().disable()
                .authorizeExchange(exchanges -> exchanges
                        // Public endpoints
                        .pathMatchers("/api/auth/**").permitAll()
                        .pathMatchers("/api/public/**").permitAll()
                        .pathMatchers("/actuator/health").permitAll()
                        .pathMatchers("/actuator/prometheus").permitAll()
                        // Admin endpoints
                        .pathMatchers("/api/admin/**").hasRole("ADMIN")
                        // All other requests need authentication
                        .anyExchange().authenticated()
                )
                .build();
    }
}
```

## Rate Limiting

### Redis-based Rate Limiter

```java
package com.glassesshop.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfig {

    // Rate limiting by User ID
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            return Mono.just(userId != null ? userId : "anonymous");
        };
    }

    // Rate limiting by IP Address
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> Mono.just(
                exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
        );
    }

    // Rate limiting by API Key
    @Bean
    public KeyResolver apiKeyResolver() {
        return exchange -> {
            String apiKey = exchange.getRequest().getHeaders().getFirst("X-API-Key");
            return Mono.just(apiKey != null ? apiKey : "no-api-key");
        };
    }
}
```

### Custom Rate Limiter

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: api-with-rate-limit
          uri: lb://api-service
          predicates:
            - Path=/api/**
          filters:
            - name: RequestRateLimiter
              args:
                key-resolver: "#{@userKeyResolver}"
                redis-rate-limiter.replenishRate: 10  # tokens per second
                redis-rate-limiter.burstCapacity: 20  # maximum tokens
                redis-rate-limiter.requestedTokens: 1 # tokens per request
```

## Circuit Breaker

### Fallback Controller

```java
package com.glassesshop.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> productFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Product service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        response.put("timestamp", LocalDateTime.now());
        response.put("data", new Object[]{});
        
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(response);
    }

    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> orderFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Order service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(response);
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> userFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(response);
    }

    @GetMapping("/inventory")
    public ResponseEntity<Map<String, Object>> inventoryFallback() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Inventory service is temporarily unavailable. Please try again later.");
        response.put("status", "SERVICE_UNAVAILABLE");
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(response);
    }
}
```

### Circuit Breaker Configuration

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 10s
        failureRateThreshold: 50
        eventConsumerBufferSize: 10
        recordExceptions:
          - org.springframework.web.client.HttpServerErrorException
          - java.util.concurrent.TimeoutException
          - java.io.IOException
    instances:
      productService:
        baseConfig: default
      orderService:
        baseConfig: default
        failureRateThreshold: 60
      userService:
        baseConfig: default
        waitDurationInOpenState: 5s
```

## Monitoring và Logging

### 1. Actuator Endpoints

Access monitoring endpoints:
- Health: `http://localhost:8080/actuator/health`
- Metrics: `http://localhost:8080/actuator/metrics`
- Prometheus: `http://localhost:8080/actuator/prometheus`
- Gateway Routes: `http://localhost:8080/actuator/gateway/routes`

### 2. Custom Health Indicator

```java
package com.glassesshop.gateway.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class CustomHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        // Custom health check logic
        boolean healthy = checkServiceHealth();
        
        if (healthy) {
            return Health.up()
                    .withDetail("gateway", "Running")
                    .withDetail("routes", "Active")
                    .build();
        } else {
            return Health.down()
                    .withDetail("gateway", "Issues detected")
                    .build();
        }
    }

    private boolean checkServiceHealth() {
        // Implement health check logic
        return true;
    }
}
```

### 3. Metrics Configuration

```java
package com.glassesshop.gateway.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

@Component
public class MetricsFilter implements GlobalFilter, Ordered {

    private final MeterRegistry meterRegistry;
    private final Counter requestCounter;
    private final Timer requestTimer;

    public MetricsFilter(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.requestCounter = Counter.builder("gateway.requests.total")
                .description("Total number of gateway requests")
                .register(meterRegistry);
        this.requestTimer = Timer.builder("gateway.requests.duration")
                .description("Gateway request duration")
                .register(meterRegistry);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        Instant start = Instant.now();
        requestCounter.increment();
        
        return chain.filter(exchange).doFinally(signalType -> {
            Duration duration = Duration.between(start, Instant.now());
            requestTimer.record(duration);
            
            meterRegistry.counter("gateway.requests.by.status",
                    "status", String.valueOf(exchange.getResponse().getStatusCode().value()))
                    .increment();
        });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }
}
```

## Deployment

### 1. Docker Configuration

```dockerfile
# Dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/gateway-service-1.0.0.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms512m -Xmx1024m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  gateway:
    build: .
    container_name: gateway-service
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - EUREKA_SERVER_URL=http://eureka-server:8761/eureka
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - eureka-server
      - redis
    networks:
      - glasses-shop-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    networks:
      - glasses-shop-network
    restart: unless-stopped

  eureka-server:
    image: eureka-server:latest
    container_name: eureka-server
    ports:
      - "8761:8761"
    networks:
      - glasses-shop-network
    restart: unless-stopped

networks:
  glasses-shop-network:
    driver: bridge
```

### 3. Kubernetes Deployment

```yaml
# gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway-service
  labels:
    app: gateway-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway-service
  template:
    metadata:
      labels:
        app: gateway-service
    spec:
      containers:
      - name: gateway-service
        image: glassesshop/gateway-service:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: EUREKA_SERVER_URL
          value: "http://eureka-server:8761/eureka"
        - name: REDIS_HOST
          value: "redis-service"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: gateway-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 20
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: gateway-service
spec:
  type: LoadBalancer
  selector:
    app: gateway-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Secret
metadata:
  name: gateway-secrets
type: Opaque
data:
  jwt-secret: WW91clN1cGVyU2VjcmV0S2V5Rm9ySldUVG9rZW5HZW5lcmF0aW9uQW5kVmFsaWRhdGlvbg==
```

### 4. Configuration for Different Environments

**application-dev.yml**
```yaml
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins: "*"
            
logging:
  level:
    root: DEBUG
    org.springframework.cloud.gateway: TRACE
```

**application-prod.yml**
```yaml
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins:
              - "https://admin.glassesshop.com"
              - "https://www.glassesshop.com"
            
logging:
  level:
    root: INFO
    org.springframework.cloud.gateway: INFO
```

## Best Practices

### 1. Security
- Always use HTTPS in production
- Implement proper JWT validation
- Use role-based access control (RBAC)
- Sanitize and validate all inputs
- Keep secrets in environment variables or secret management systems

### 2. Performance
- Enable response caching where appropriate
- Use connection pooling
- Implement proper timeout configurations
- Monitor and optimize route predicates
- Use asynchronous/non-blocking operations

### 3. Resilience
- Implement circuit breakers for all downstream services
- Configure proper retry strategies
- Set appropriate timeouts
- Implement fallback mechanisms
- Use bulkhead patterns to isolate failures

### 4. Monitoring
- Enable comprehensive logging
- Use distributed tracing (Zipkin/Jaeger)
- Monitor metrics (Prometheus/Grafana)
- Set up alerts for critical issues
- Track SLAs and SLOs

### 5. Testing
- Write unit tests for filters and predicates
- Implement integration tests for routes
- Perform load testing
- Test circuit breaker scenarios
- Validate security configurations

## Troubleshooting

### Common Issues

1. **Route not working**
   - Check predicate configuration
   - Verify service discovery registration
   - Check logs for routing decisions

2. **Circuit breaker always open**
   - Review failure threshold settings
   - Check downstream service health
   - Verify timeout configurations

3. **Rate limiting not working**
   - Ensure Redis is running and accessible
   - Verify key resolver configuration
   - Check rate limiter settings

4. **CORS errors**
   - Review CORS configuration
   - Check allowed origins
   - Verify preflight request handling

## Tài liệu tham khảo (References)

- [Spring Cloud Gateway Documentation](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/)
- [Spring Cloud Netflix Eureka](https://cloud.spring.io/spring-cloud-netflix/reference/html/)
- [Resilience4j Documentation](https://resilience4j.readme.io/)
- [Redis Rate Limiter](https://redis.io/topics/rate-limiting)
- [Spring Security WebFlux](https://docs.spring.io/spring-security/reference/reactive/index.html)

## Kết luận

Spring Cloud Gateway cung cấp một giải pháp mạnh mẽ và linh hoạt cho việc xây dựng API Gateway trong kiến trúc microservices. Với khả năng routing động, security, resilience patterns và monitoring tích hợp, nó là lựa chọn lý tưởng cho dự án Glasses Shop.

Các tính năng chính:
- ✅ Non-blocking reactive architecture
- ✅ Flexible routing with predicates
- ✅ Comprehensive filter support
- ✅ Built-in security integration
- ✅ Circuit breaker and resilience patterns
- ✅ Rate limiting capabilities
- ✅ Monitoring and observability
- ✅ Easy integration with Spring ecosystem

Để triển khai thành công, cần:
1. Hiểu rõ kiến trúc microservices
2. Cấu hình đúng routing và predicates
3. Implement security properly
4. Monitor và optimize performance
5. Test thoroughly in all scenarios
