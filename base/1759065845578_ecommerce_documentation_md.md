# 🌱 Sistema de E-commerce para Varejo Sustentável - Documentação Técnica Completa

## 📋 Informações Gerais

**Nome do Sistema:** EcoVarejo E-commerce Platform  
**Versão:** 2.1.0  
**Empresa:** EcoVarejo Ltda.  
**Data de Criação:** Janeiro 2024  
**Última Atualização:** Setembro 2025  
**Classificação:** Interno - Confidencial  
**Responsável Técnico:** Arquiteto de Soluções - João Silva  
**Equipe de Desenvolvimento:** 12 desenvolvedores, 3 DevOps, 2 Security Engineers  

---

## 🎯 Visão Geral do Sistema

### Propósito
Plataforma integrada de e-commerce focada na comercialização de produtos sustentáveis, oferecendo uma experiência completa para clientes B2C e B2B, com forte ênfase em práticas ambientalmente responsáveis e compliance regulatório (LGPD).

### Características Principais
- ✅ Arquitetura de microsserviços containerizada
- ✅ Infraestrutura cloud-native com Kubernetes
- ✅ API-first design com GraphQL e REST
- ✅ Multi-tenant com separação de dados por cliente
- ✅ Processamento assíncrono com message queues
- ✅ Observabilidade completa (logs, métricas, traces)
- ✅ Segurança end-to-end com zero-trust
- ✅ CI/CD automatizado com GitOps

---

## 🏗️ Arquitetura de Microsserviços

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ECOVAREJO E-COMMERCE PLATFORM                 │
├─────────────────────────────────────────────────────────────────────────┤
│  🌐 FRONTEND LAYER                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   React PWA     │  │   Admin Panel   │  │   Mobile App    │         │
│  │   (Next.js)     │  │   (Vue.js)      │  │   (React Native)│         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  🚪 API GATEWAY LAYER                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     KONG API GATEWAY                               │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │ │
│  │  │Rate Limiting│ │Authentication│ │   Logging   │ │   Caching   │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  ⚡ MICROSERVICES LAYER                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ User Service    │  │ Product Service │  │ Order Service   │         │
│  │ (Node.js/NestJS)│  │ (Go/Fiber)     │  │ (Python/FastAPI)│         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │Payment Service  │  │Inventory Service│  │Notification Svc │         │
│  │ (Java/Spring)   │  │ (Rust/Actix)   │  │ (Node.js/Express)│         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │Analytics Service│  │   AI/ML Service │  │ Logistics Svc   │         │
│  │ (Scala/Akka)    │  │ (Python/TensorF)│  │ (Go/Gin)        │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  📨 MESSAGE BROKER LAYER                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                        APACHE KAFKA                                 │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │ │
│  │  │user-events  │ │order-events │ │inventory-evt│ │notification │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  🗄️ DATA LAYER                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   PostgreSQL    │  │    MongoDB      │  │     Redis       │         │
│  │ (Transactional) │  │ (Document Store)│  │   (Cache/Session)│        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Elasticsearch  │  │  InfluxDB       │  │   MinIO (S3)    │         │
│  │   (Search)      │  │ (Time Series)   │  │ (Object Storage)│         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Detalhamento dos Microsserviços

#### 1. 👤 User Service (Node.js/NestJS)
**Responsabilidades:**
- Gerenciamento de contas de usuários (B2C/B2B)
- Autenticação e autorização (OAuth 2.0 + OIDC)
- Perfis e preferências
- Programa de fidelidade ecológica

**Tecnologias:**
- Node.js 18 + NestJS 10
- PostgreSQL para dados relacionais
- Redis para sessões e cache
- JWT + Refresh Tokens
- Passport.js para estratégias de auth

**Endpoints Principais:**
```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/users/profile
PUT  /api/v1/users/profile
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout
```

**Banco de Dados:**
```sql
-- Tabela principal de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    user_type ENUM('customer', 'admin', 'supplier') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    sustainability_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Endereços dos usuários
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'Brasil',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. 🛍️ Product Service (Go/Fiber)
**Responsabilidades:**
- Catálogo de produtos sustentáveis
- Gestão de categorias e taxonomia
- Certificações ecológicas
- Avaliações e reviews
- Busca e filtros avançados

**Tecnologias:**
- Go 1.21 + Fiber v2
- MongoDB para dados de produtos
- Elasticsearch para busca
- MinIO para imagens/assets
- Redis para cache de consultas

**Estrutura de Dados (MongoDB):**
```javascript
// Coleção: products
{
  "_id": ObjectId("..."),
  "sku": "ECO-TSHIRT-001",
  "name": "Camiseta Orgânica Básica",
  "description": "Camiseta feita com algodão 100% orgânico...",
  "category": {
    "id": "clothing",
    "name": "Vestuário",
    "subcategory": "camisetas"
  },
  "price": {
    "amount": 89.90,
    "currency": "BRL"
  },
  "sustainability": {
    "certifications": [
      {
        "name": "GOTS",
        "level": "organic",
        "issuer": "Global Organic Textile Standard",
        "expiry": ISODate("2025-12-31")
      }
    ],
    "carbon_footprint": 2.5, // kg CO2
    "recyclable": true,
    "biodegradable": true,
    "sustainability_score": 9.2
  },
  "inventory": {
    "stock_quantity": 150,
    "reserved_quantity": 5,
    "reorder_level": 20,
    "supplier_id": "supplier-001"
  },
  "media": [
    {
      "type": "image",
      "url": "https://cdn.ecovarejo.com/products/eco-tshirt-001-main.jpg",
      "alt": "Camiseta Orgânica Básica - Frente",
      "order": 1
    }
  ],
  "attributes": {
    "material": "Algodão Orgânico",
    "color": ["Branco", "Preto", "Cinza"],
    "size": ["P", "M", "G", "GG"],
    "care_instructions": "Lavar a 30°C, secar à sombra"
  },
  "seo": {
    "meta_title": "Camiseta Orgânica Básica - EcoVarejo",
    "meta_description": "Camiseta sustentável feita com algodão orgânico...",
    "slug": "camiseta-organica-basica"
  },
  "status": "active",
  "created_at": ISODate("2024-01-15"),
  "updated_at": ISODate("2024-09-20")
}
```

#### 3. 📦 Order Service (Python/FastAPI)
**Responsabilidades:**
- Processamento de pedidos
- Gestão de carrinho de compras
- Aplicação de descontos e cupons
- Integração com pagamentos
- Rastreamento de status

**Tecnologias:**
- Python 3.11 + FastAPI
- PostgreSQL para dados transacionais
- Redis para carrinho de compras
- Celery para processamento assíncrono
- SQLAlchemy como ORM

**Modelo de Dados:**
```python
# models/order.py
from sqlalchemy import Column, String, Integer, Decimal, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(20), unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(50), default="pending")
    
    # Valores monetários
    subtotal = Column(Decimal(10, 2), nullable=False)
    discount_amount = Column(Decimal(10, 2), default=0)
    tax_amount = Column(Decimal(10, 2), default=0)
    shipping_cost = Column(Decimal(10, 2), default=0)
    total_amount = Column(Decimal(10, 2), nullable=False)
    
    # Endereço de entrega
    shipping_address = Column(Text)
    billing_address = Column(Text)
    
    # Sustentabilidade
    carbon_footprint = Column(Decimal(8, 2))  # kg CO2
    sustainability_score = Column(Integer)
    eco_packaging = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
```

**Fluxo de Processamento de Pedidos:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cart Created  │ ─> │ Items Validated │ ─> │ Inventory Check │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Order Created  │ <─ │ Payment Process │ <─ │ Pricing Applied │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Fulfillment     │ <─ │   Notification  │ <─ │ Inventory Lock  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 4. 💳 Payment Service (Java/Spring Boot)
**Responsabilidades:**
- Processamento de pagamentos
- Tokenização de cartões
- Gestão de gateways de pagamento
- Reconciliação financeira
- Compliance PCI DSS

**Tecnologias:**
- Java 17 + Spring Boot 3.1
- PostgreSQL para transações
- Kafka para eventos de pagamento
- Vault para secrets management
- Micrometer para métricas

**Arquitetura de Segurança:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT SERVICE SECURITY                       │
├─────────────────────────────────────────────────────────────────────────┤
│  🔐 ENCRYPTION LAYER                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   TLS 1.3       │  │   AES-256-GCM   │  │   RSA-4096      │         │
│  │  (In Transit)   │  │   (At Rest)     │  │  (Key Exchange) │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  🛡️ TOKENIZATION LAYER                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         CARD TOKENIZATION                           │ │
│  │  Card Number → SHA-256 Hash → Token Store → Encrypted Vault         │ │
│  │  Real PAN never stored in application database                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  🏦 PAYMENT GATEWAYS                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Stripe API    │  │  PagSeguro API  │  │  Mercado Pago   │         │
│  │   (Primary)     │  │   (Secondary)   │  │   (Tertiary)    │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 5. 📊 Analytics Service (Scala/Akka)
**Responsabilidades:**
- Coleta e processamento de eventos
- Relatórios de vendas e performance
- Análise de comportamento do usuário
- Métricas de sustentabilidade
- Data warehouse e BI

**Tecnologias:**
- Scala 2.13 + Akka HTTP
- InfluxDB para métricas de tempo real
- Apache Spark para big data
- PostgreSQL para dados agregados
- Grafana para visualização

#### 6. 🤖 AI/ML Service (Python/TensorFlow)
**Responsabilidades:**
- Sistema de recomendações
- Análise preditiva de demanda
- Detecção de fraude
- Otimização de preços
- Classificação automática de produtos

**Tecnologias:**
- Python 3.11 + TensorFlow 2.13
- scikit-learn para ML clássico
- Redis para cache de modelos
- MLflow para experiment tracking
- Kubeflow para pipeline ML

---

## 🌐 API Gateway - Kong Configuration

### Kong Gateway Setup

```yaml
# kong.yml - Configuração declarativa
_format_version: "3.0"
_transform: true

services:
  - name: user-service
    url: http://user-service:3000
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
      - name: jwt
      - name: cors
        config:
          origins: 
            - "https://app.ecovarejo.com"
          credentials: true
      - name: request-size-limiting
        config:
          allowed_payload_size: 10

  - name: product-service
    url: http://product-service:8080
    plugins:
      - name: rate-limiting
        config:
          minute: 200
          hour: 2000
      - name: response-caching
        config:
          cache_ttl: 300
      - name: gzip
        config:
          types:
            - application/json
            - text/plain

  - name: order-service
    url: http://order-service:8000
    plugins:
      - name: rate-limiting
        config:
          minute: 50
          hour: 500
      - name: jwt
      - name: request-logging
        config:
          log_level: info

routes:
  - name: user-routes
    service: user-service
    paths:
      - /api/v1/auth
      - /api/v1/users
    methods:
      - GET
      - POST
      - PUT
      - DELETE

  - name: product-routes
    service: product-service
    paths:
      - /api/v1/products
      - /api/v1/categories
    methods:
      - GET
      - POST
      - PUT
      - DELETE

  - name: order-routes
    service: order-service
    paths:
      - /api/v1/orders
      - /api/v1/cart
    methods:
      - GET
      - POST
      - PUT
      - DELETE

plugins:
  - name: prometheus
    config:
      per_consumer: true
  - name: zipkin
    config:
      http_endpoint: "http://zipkin:9411/api/v2/spans"
  - name: file-log
    config:
      path: "/var/log/kong/access.log"
```

### Gateway Monitoring e Observabilidade

```yaml
# Métricas do Kong expostas via Prometheus
kong_http_requests_total
kong_http_requests_duration_seconds
kong_bandwidth_bytes
kong_nginx_connections_total
kong_upstream_target_health
```

---

## 🔒 Segurança e Compliance

### Implementação LGPD

#### Data Protection Officer (DPO) Sistema
```python
# Módulo de compliance LGPD
class LGPDCompliance:
    def __init__(self):
        self.data_processor = DataProcessor()
        self.consent_manager = ConsentManager()
        self.audit_logger = AuditLogger()
    
    def collect_personal_data(self, user_id: str, data: dict, purpose: str):
        """Coleta dados pessoais com consentimento explícito"""
        consent = self.consent_manager.get_consent(user_id, purpose)
        if not consent.is_valid():
            raise ConsentRequiredException()
        
        # Log da coleta para auditoria
        self.audit_logger.log_data_collection({
            'user_id': user_id,
            'data_types': list(data.keys()),
            'purpose': purpose,
            'consent_id': consent.id,
            'timestamp': datetime.utcnow()
        })
        
        return self.data_processor.encrypt_and_store(data)
    
    def handle_data_subject_request(self, request_type: str, user_id: str):
        """Processa solicitações do titular dos dados"""
        if request_type == 'access':
            return self.export_user_data(user_id)
        elif request_type == 'deletion':
            return self.anonymize_user_data(user_id)
        elif request_type == 'portability':
            return self.export_portable_data(user_id)
        elif request_type == 'correction':
            return self.enable_data_correction(user_id)
```

### Zero Trust Security Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            ZERO TRUST ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│  🔐 IDENTITY & ACCESS MANAGEMENT                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Okta/Auth0    │  │      RBAC       │  │       MFA       │         │
│  │   (Identity)    │  │  (Authorization)│  │  (Multi-Factor) │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  🛡️ NETWORK SECURITY                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                       NETWORK SEGMENTATION                          │ │
│  │  DMZ → Web Tier → App Tier → Data Tier → Management Tier           │ │
│  │  Each tier isolated with micro-segmentation                        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  📊 CONTINUOUS MONITORING                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Falco HIDS    │  │   Calico CNI    │  │   OPA Gatekeeper│         │
│  │  (Runtime Sec)  │  │ (Network Policy)│  │  (Policy Engine)│         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Criptografia End-to-End

**Dados em Trânsito:**
- TLS 1.3 para todas as comunicações
- Certificate Pinning no mobile
- HSTS headers configurados
- Perfect Forward Secrecy habilitado

**Dados em Repouso:**
- AES-256-GCM para databases
- Chaves gerenciadas pelo AWS KMS
- Rotação automática de chaves (90 dias)
- Envelope encryption para dados sensíveis

---

## 🚀 DevOps e Infraestrutura

### Kubernetes Cluster Architecture

```yaml
# cluster-topology.yml
apiVersion: v1
kind: Namespace
metadata:
  name: ecovarejo-prod
  labels:
    environment: production
    security-policy: restricted
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: ecovarejo-prod
spec:
  podSelector: {}
  policyTypes:
  - Ingress
---
# Service Mesh com Istio
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: ecovarejo-mesh
spec:
  values:
    pilot:
      env:
        EXTERNAL_ISTIOD: false
    gateways:
      istio-ingressgateway:
        type: LoadBalancer
        ports:
        - port: 443
          name: https
          protocol: HTTPS
```

### GitOps Pipeline com ArgoCD

```yaml
# argo-application.yml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ecovarejo-platform
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/ecovarejo/k8s-manifests
    targetRevision: HEAD
    path: manifests/production
  destination:
    server: https://kubernetes.default.svc
    namespace: ecovarejo-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
```

### Monitoring Stack

```yaml
# prometheus-values.yaml
prometheus:
  prometheusSpec:
    retention: 30d
    resources:
      requests:
        memory: 2Gi
        cpu: 1000m
      limits:
        memory: 4Gi
        cpu: 2000m
    serviceMonitorSelectorNilUsesHelmValues: false
    ruleNamespaceSelector: {}
    ruleSelector: {}
    serviceMonitorNamespaceSelector: {}
    serviceMonitorSelector: {}

grafana:
  adminPassword: ${GRAFANA_ADMIN_PASSWORD}
  dashboards:
    default:
      ecovarejo-overview:
        gnetId: 12345
        revision: 1
        datasource: Prometheus
      kubernetes-cluster:
        gnetId: 7249
        revision: 1
        datasource: Prometheus

alertmanager:
  config:
    global:
      slack_api_url: '${SLACK_WEBHOOK_URL}'
    route:
      group_by: ['alertname']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      receiver: 'slack-notifications'
    receivers:
    - name: 'slack-notifications'
      slack_configs:
      - channel: '#ecovarejo-alerts'
        title: 'EcoVarejo Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

---

## 📈 Performance e Escalabilidade

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

### Cache Strategy

```redis
# Redis Configuration for Performance
# Cache Layers:
# L1 - Application Memory Cache (5 minutes TTL)
# L2 - Redis Distributed Cache (30 minutes TTL)  
# L3 - Database with Connection Pooling

# Product Catalog Cache
SET product:eco-tshirt-001 '{"name":"Camiseta Orgânica","price":89.90}' EX 1800

# User Session Cache
SET session:user-123 '{"user_id":"123","permissions":["read","write"]}' EX 3600

# Cart Cache
SET cart:user-123 '[{"product_id":"eco-tshirt-001","quantity":2}]' EX 86400

# Search Results Cache
SET search:organic-clothing '{"results":[...],"total":150}'