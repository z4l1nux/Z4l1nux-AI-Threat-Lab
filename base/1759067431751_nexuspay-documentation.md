# 💳 NexusPay Orquestrador de Pagamentos - Documentação Técnica Completa

## 📋 Informações Gerais

**Nome do Sistema:** NexusPay Payment Orchestrator  
**Versão:** 3.2.0  
**Empresa:** FinTech Solutions Corp  
**Data de Criação:** Março 2023  
**Última Atualização:** Setembro 2025  
**Classificação:** Restrita - Dados Sensíveis PCI DSS  
**Responsável Técnico:** Arquiteto de Pagamentos - Maria Santos  
**Equipe de Desenvolvimento:** 18 desenvolvedores, 4 DevOps, 3 Security Engineers, 2 Compliance Officers  

---

## 🎯 Visão Geral do Sistema

### Propósito
Plataforma de orquestração de pagamentos digitais para marketplaces globais, oferecendo uma solução completa para processamento, tokenização, split de repasses e liquidação de transações em múltiplas moedas com compliance regulatório integral (PCI DSS Level 1, LGPD, PSD2).

### Características Principais
- ✅ Arquitetura de microsserviços PCI DSS compliant
- ✅ Tokenização de cartões com HSM dedicado
- ✅ Multi-tenant com isolamento de dados por merchant
- ✅ Processamento assíncrono com alta disponibilidade
- ✅ Anti-fraude com ML em tempo real
- ✅ Split automático de repasses multipartes
- ✅ Reconciliação bancária automatizada
- ✅ Compliance regulatório automatizado

---

## 🏗️ Arquitetura de Microsserviços

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEXUSPAY PAYMENT ORCHESTRATOR                   │
├─────────────────────────────────────────────────────────────────────────┤
│  🌐 EXTERNAL INTEGRATIONS                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Acquirers     │  │   KYC/KYB APIs  │  │ Notification    │         │
│  │  (Visa/Master)  │  │   (Serasa/SPC)  │  │ (Twilio/AWS SES)│         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  🚪 API GATEWAY LAYER                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     KONG ENTERPRISE GATEWAY                        │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │ │
│  │  │Rate Limiting│ │  WAF + DDoS │ │ OAuth 2.0   │ │PCI Firewall │   │ │
│  │  │(100 req/min)│ │Protection   │ │JWT + mTLS   │ │   Rules     │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  🏢 ADMIN PANEL                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ Admin Dashboard │  │ Merchant Portal │  │ Compliance Hub  │         │
│  │   (React/TS)    │  │   (Vue.js 3)    │  │ (Angular/RxJS)  │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  ⚡ MICROSERVICES LAYER                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ Merchant Service│  │ Payment Service │  │Tokenization Svc │         │
│  │ (Node.js/NestJS)│  │ (Node.js/Express│  │ (Java/Spring)   │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │Anti-Fraud Svc   │  │ Split Service   │  │Reconciliation   │         │
│  │ (Python/FastAPI)│  │ (Go/Gin)        │  │Svc (Python/Celery)│       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │Notification Svc │  │ Reporting Svc   │  │ Compliance Svc  │         │
│  │ (Node.js/Koa)   │  │ (Scala/Akka)    │  │ (Java/Quarkus)  │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  📨 MESSAGE BROKER LAYER                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                     APACHE KAFKA CLUSTER                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │ │
│  │  │payment-evts │ │fraud-alerts │ │split-events │ │audit-logs   │   │ │
│  │  │replication:3│ │partitions:12│ │retention:7d │ │encryption   │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  🔐 SECURITY & SECRETS                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      HASHICORP VAULT CLUSTER                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │ │
│  │  │   API Keys  │ │Card Tokens  │ │ Certificates│ │  DB Secrets │   │ │
│  │  │Auto-Rotate │ │  AES-256    │ │    x.509    │ │   Dynamic   │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  🗄️ DATA LAYER                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  PostgreSQL     │  │     Redis       │  │   TimescaleDB   │         │
│  │(Transactions)   │  │ (Cache/Session) │  │ (Time Series)   │         │
│  │Multi-Master HA  │  │   Cluster 6x    │  │  Metrics/Logs   │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Elasticsearch │  │   ClickHouse    │  │    MinIO S3     │         │
│  │ (Audit/Search)  │  │   (Analytics)   │  │   (File Store)  │         │
│  │   3 Node Cluster│  │  Columnar OLAP  │  │ Encrypted Blobs │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Detalhamento dos Microsserviços

#### 1. 🏪 Merchant Service (Node.js/NestJS)
**Responsabilidades:**
- Onboarding e KYC/KYB de merchants
- Gestão de contas e subcuentas
- Configuração de produtos e taxas
- API de cadastro e autenticação
- Webhook management

**Tecnologias:**
- Node.js 20 + NestJS 10
- PostgreSQL 15 com replicação
- Redis para cache e sessões
- Vault para credenciais
- Bull Queue para processamento assíncrono

**Endpoints Principais:**
```
POST /api/v1/merchants/register
POST /api/v1/merchants/kyc/submit
GET  /api/v1/merchants/profile
PUT  /api/v1/merchants/settings
POST /api/v1/merchants/webhooks
GET  /api/v1/merchants/balance
POST /api/v1/merchants/withdraw
```

**Modelo de Dados:**
```sql
-- Tabela principal de merchants
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    document_number VARCHAR(20) UNIQUE NOT NULL, -- CPF/CNPJ
    document_type ENUM('cpf', 'cnpj') NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Status e verificações
    status ENUM('pending', 'active', 'suspended', 'blocked') DEFAULT 'pending',
    kyc_status ENUM('pending', 'approved', 'rejected', 'reviewing') DEFAULT 'pending',
    kyc_reviewed_at TIMESTAMP,
    kyc_reviewer_id UUID,
    
    -- Configurações comerciais
    category_code VARCHAR(10), -- MCC Code
    estimated_volume DECIMAL(15,2),
    business_model TEXT,
    website_url VARCHAR(500),
    
    -- Dados bancários
    bank_code VARCHAR(10),
    bank_agency VARCHAR(10),
    bank_account VARCHAR(20),
    bank_account_type ENUM('checking', 'savings'),
    pix_key VARCHAR(77), -- Chave PIX
    
    -- Taxas e configurações
    payment_fee_rate DECIMAL(5,4) DEFAULT 0.0399, -- 3.99%
    anticipation_fee_rate DECIMAL(5,4) DEFAULT 0.0299, -- 2.99%
    split_enabled BOOLEAN DEFAULT false,
    auto_transfer BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit fields
    created_by UUID,
    updated_by UUID
);

-- Tabela de configurações de webhooks
CREATE TABLE merchant_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- payment_approved, payment_rejected, etc.
    endpoint_url VARCHAR(500) NOT NULL,
    secret_token VARCHAR(100) NOT NULL, -- Para HMAC validation
    is_active BOOLEAN DEFAULT true,
    retry_policy JSONB DEFAULT '{"max_attempts": 3, "backoff": "exponential"}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_merchants_kyc_status ON merchants(kyc_status);
CREATE INDEX idx_merchants_document ON merchants(document_number);
CREATE INDEX idx_webhooks_merchant_event ON merchant_webhooks(merchant_id, event_type);
```

#### 2. 💳 Payment Service (Node.js/Express)
**Responsabilidades:**
- Processamento de transações
- Autorização e captura
- Gestão de estados de pagamento
- Integração com adquirentes
- Retry policies e fallbacks

**Tecnologias:**
- Node.js 20 + Express.js 4.18
- PostgreSQL com sharding por merchant
- Redis para idempotência
- Kafka para eventos
- Circuit Breaker pattern

**Fluxo de Pagamento:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Payment Request │ ─> │   Validation    │ ─> │  Anti-Fraud     │
│ (Card/PIX/Boleto)│    │ (Amount/Merchant)│    │   Analysis      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Authorization │ <─ │  Tokenization   │ <─ │  Risk Score     │
│   (Acquirer)    │    │    (Vault)      │    │   < 75%         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Settlement    │ <─ │    Capture      │ <─ │  Authorization  │
│   (T+1/T+30)    │    │   (Manual/Auto) │    │   Approved      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Modelo de Dados de Transações:**
```sql
-- Tabela principal de pagamentos
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100) UNIQUE, -- ID do merchant
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    
    -- Dados do pagamento
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) DEFAULT 'BRL',
    payment_method ENUM('credit_card', 'debit_card', 'pix', 'boleto', 'wallet') NOT NULL,
    
    -- Status e estado
    status ENUM('pending', 'processing', 'authorized', 'captured', 'settled', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    gateway_status VARCHAR(50), -- Status do adquirente
    gateway_response JSONB, -- Resposta completa do gateway
    
    -- Dados do cliente (tokenizados)
    customer_document_hash VARCHAR(64), -- SHA-256 do documento
    customer_email_hash VARCHAR(64), -- SHA-256 do email
    customer_ip INET,
    user_agent TEXT,
    
    -- Dados do cartão (tokenizados)
    card_token UUID, -- Referência para vault
    card_brand VARCHAR(20), -- visa, mastercard, etc.
    card_last_four CHAR(4),
    
    -- Dados de risco e fraude
    risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
    fraud_analysis JSONB,
    device_fingerprint VARCHAR(100),
    
    -- Taxas e valores líquidos
    merchant_fee DECIMAL(10,4), -- Taxa do merchant
    gateway_fee DECIMAL(10,4), -- Taxa do adquirente
    net_amount DECIMAL(15,2), -- Valor líquido para o merchant
    
    -- Split de pagamentos
    split_rules JSONB, -- Regras de divisão
    
    -- Prazos e liquidação
    settlement_date DATE, -- Data prevista de liquidação
    settled_at TIMESTAMP, -- Data real de liquidação
    
    -- Dados de captura
    captured_at TIMESTAMP,
    capture_method ENUM('automatic', 'manual') DEFAULT 'automatic',
    
    -- Metadados
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Auditoria
    created_by UUID,
    updated_by UUID
);

-- Tabela de eventos de pagamento para auditoria
CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    event_type VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    gateway_response JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Particionamento por data para performance
CREATE TABLE payments_2025_09 PARTITION OF payments
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
    
-- Índices para queries frequentes
CREATE INDEX idx_payments_merchant_status ON payments(merchant_id, status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_settlement_date ON payments(settlement_date);
CREATE INDEX idx_payments_external_id ON payments(external_id);
```

#### 3. 🔒 Tokenization Service (Java/Spring Boot)
**Responsabilidades:**
- Tokenização de cartões de crédito/débito
- Gestão segura de dados sensíveis
- Integração com HSM (Hardware Security Module)
- Detokenização controlada
- Compliance PCI DSS Level 1

**Tecnologias:**
- Java 17 + Spring Boot 3.1
- PostgreSQL com TDE (Transparent Data Encryption)
- HashiCorp Vault para chaves
- Luna HSM para operações criptográficas
- Spring Security para controle de acesso

**Arquitetura de Tokenização:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                       TOKENIZATION ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│  📨 INPUT: SENSITIVE CARD DATA                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Card Number: 4111 1111 1111 1111                                  │ │
│  │  CVV: 123                                                          │ │
│  │  Expiry: 12/26                                                     │ │
│  │  Holder: João Silva                                                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  🔐 TOKENIZATION PROCESS                                                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   Format        │ ─> │   Validate      │ ─> │    Generate     │     │
│  │ Preserving      │    │   Luhn Check    │    │   Random UUID   │     │
│  │ (BIN + Last4)   │    │   + Rules       │    │   Token         │     │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘     │
│           │                        │                        │           │
│           ▼                        ▼                        ▼           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │    AES-256      │    │   Luna HSM      │    │   Vault Store   │     │
│  │   Encryption    │    │  Key Generate   │    │  Token Mapping  │     │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────────┤
│  📤 OUTPUT: SECURE TOKEN                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Token: 550e8400-e29b-41d4-a716-446655440000                       │ │
│  │  Format: 4111-****-****-1111 (BIN preserved)                       │ │
│  │  Metadata: {brand: "visa", type: "credit", country: "BR"}           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

**Implementação Java:**
```java
@Service
@Transactional
@Slf4j
public class TokenizationService {
    
    @Autowired
    private VaultOperations vaultOperations;
    
    @Autowired
    private HSMCryptoService hsmCryptoService;
    
    @Value("${tokenization.vault.path}")
    private String vaultPath;
    
    public TokenizationResponse tokenizeCard(CardData cardData) {
        try {
            // Validação de entrada
            validateCardData(cardData);
            
            // Verificação de duplicatas
            Optional<String> existingToken = findExistingToken(cardData);
            if (existingToken.isPresent()) {
                return TokenizationResponse.builder()
                    .token(existingToken.get())
                    .status("existing")
                    .build();
            }
            
            // Geração de token único
            String token = generateSecureToken();
            
            // Criptografia com HSM
            String encryptedPan = hsmCryptoService.encrypt(cardData.getCardNumber());
            
            // Armazenamento seguro no Vault
            CardVaultEntry vaultEntry = CardVaultEntry.builder()
                .token(token)
                .encryptedPan(encryptedPan)
                .cardBrand(detectCardBrand(cardData.getCardNumber()))
                .lastFourDigits(cardData.getCardNumber().substring(12))
                .expiryDate(cardData.getExpiryDate())
                .holderName(hashPII(cardData.getHolderName()))
                .createdAt(Instant.now())
                .build();
                
            vaultOperations.write(vaultPath + "/" + token, vaultEntry);
            
            // Log de auditoria
            auditLogger.logTokenization(cardData.getMerchantId(), token, 
                cardData.getCardNumber().substring(0, 6), "SUCCESS");
            
            return TokenizationResponse.builder()
                .token(token)
                .maskedPan(maskCardNumber(cardData.getCardNumber()))
                .cardBrand(vaultEntry.getCardBrand())
                .status("created")
                .build();
                
        } catch (Exception e) {
            log.error("Tokenization failed", e);
            auditLogger.logTokenization(cardData.getMerchantId(), null, 
                cardData.getCardNumber().substring(0, 6), "FAILED");
            throw new TokenizationException("Unable to tokenize card", e);
        }
    }
    
    public String detokenize(String token, String merchantId) {
        // Verificação de autorização
        if (!authorizationService.canDetokenize(merchantId, token)) {
            throw new UnauthorizedDetokenizationException();
        }
        
        // Recuperação do Vault
        CardVaultEntry vaultEntry = vaultOperations.read(vaultPath + "/" + token, 
            CardVaultEntry.class);
        
        if (vaultEntry == null) {
            throw new TokenNotFoundException(token);
        }
        
        // Descriptografia com HSM
        String decryptedPan = hsmCryptoService.decrypt(vaultEntry.getEncryptedPan());
        
        // Log de auditoria
        auditLogger.logDetokenization(merchantId, token, "SUCCESS");
        
        return decryptedPan;
    }
}
```

#### 4. 🛡️ Anti-Fraud Service (Python/FastAPI)
**Responsabilidades:**
- Análise de risco em tempo real
- Machine Learning para detecção de padrões
- Regras de negócio configuráveis
- Blacklist/Whitelist management
- Score de risco por transação

**Tecnologias:**
- Python 3.11 + FastAPI
- TensorFlow/scikit-learn para ML
- Redis para cache de regras
- PostgreSQL para histórico
- MLflow para model versioning

**Engine de Análise de Risco:**
```python
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
from typing import Dict, List, Optional
import asyncio
import redis
import logging

app = FastAPI(title="NexusPay Anti-Fraud Service")
redis_client = redis.Redis(host='redis-cluster', port=6379, decode_responses=True)
logger = logging.getLogger(__name__)

class TransactionAnalysisRequest(BaseModel):
    transaction_id: str
    merchant_id: str
    amount: float
    currency: str = "BRL"
    payment_method: str
    customer_document_hash: str
    customer_email_hash: str
    customer_ip: str
    device_fingerprint: Optional[str] = None
    card_bin: Optional[str] = None
    card_country: Optional[str] = None
    metadata: Dict = {}

class RiskAnalysisResponse(BaseModel):
    transaction_id: str
    risk_score: int  # 0-100
    decision: str   # approve, review, deny
    rules_triggered: List[str]
    ml_score: float
    processing_time_ms: int
    recommendations: List[str]

class FraudAnalysisEngine:
    def __init__(self):
        self.ml_model = tf.keras.models.load_model('/models/fraud_detection_v2.h5')
        self.rules_engine = RulesEngine()
        self.feature_extractor = FeatureExtractor()
    
    async def analyze_transaction(self, request: TransactionAnalysisRequest) -> RiskAnalysisResponse:
        start_time = time.time()
        
        try:
            # Extração de features para ML
            features = await self.feature_extractor.extract_features(request)
            
            # Análise com modelo de ML
            ml_prediction = await self.ml_analysis(features)
            
            # Aplicação de regras de negócio
            rules_result = await self.rules_engine.evaluate(request)
            
            # Cálculo do score final
            final_score = self.calculate_final_score(ml_prediction, rules_result)
            
            # Decisão baseada no score
            decision = self.make_decision(final_score)
            
            processing_time = int((time.time() - start_time) * 1000)
            
            # Cache do resultado para consultas futuras
            await self.cache_result(request.transaction_id, final_score, decision)
            
            return RiskAnalysisResponse(
                transaction_id=request.transaction_id,
                risk_score=final_score,
                decision=decision,
                rules_triggered=rules_result.triggered_rules,
                ml_score=ml_prediction.probability,
                processing_time_ms=processing_time,
                recommendations=self.generate_recommendations(final_score, rules_result)
            )
            
        except Exception as e:
            logger.error(f"Fraud analysis failed for {request.transaction_id}: {str(e)}")
            # Fallback para aprovação com score médio em caso de erro
            return RiskAnalysisResponse(
                transaction_id=request.transaction_id,
                risk_score=50,
                decision="review",
                rules_triggered=["system_error"],
                ml_score=0.5,
                processing_time_ms=int((time.time() - start_time) * 1000),
                recommendations=["Manual review required due to system error"]
            )
    
    async def ml_analysis(self, features: np.ndarray) -> MLPrediction:
        """Análise usando modelo de Machine Learning"""
        prediction_prob = self.ml_model.predict(features.reshape(1, -1))[0][0]
        
        return MLPrediction(
            probability=float(prediction_prob),
            confidence=self.calculate_confidence(features),
            feature_importance=self.get_feature_importance(features)
        )
    
    def calculate_final_score(self, ml_result: MLPrediction, rules_result: RulesResult) -> int:
        """Combina score de ML com regras de negócio"""
        base_score = int(ml_result.probability * 100)
        
        # Ajustes baseados em regras
        for rule in rules_result.triggered_rules:
            if rule.startswith("high_risk_"):
                base_score += 30
            elif rule.startswith("medium_risk_"):
                base_score += 15
            elif rule.startswith("whitelist_"):
                base_score -= 20
        
        # Normalização para 0-100
        return max(0, min(100, base_score))
    
    def make_decision(self, score: int) -> str:
        """Decisão baseada no score de risco"""
        if score <= 30:
            return "approve"
        elif score <= 70:
            return "review"
        else:
            return "deny"

@app.post("/api/v1/analyze", response_model=RiskAnalysisResponse)
async def analyze_transaction(