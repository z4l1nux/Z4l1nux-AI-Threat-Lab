# AI TRiSM Framework (Gartner)

## AI Trust, Risk and Security Management

**Fonte**: Gartner - AI TRiSM Framework  
**Versão**: 2024-2025

---

## Visão Geral

**AI TRiSM** é um framework do Gartner para gerenciar confiança, risco e segurança em sistemas de Inteligência Artificial, garantindo que modelos de IA sejam:

- ✅ **Confiáveis** (Trustworthy)
- ✅ **Seguros** (Secure)
- ✅ **Privados** (Privacy-preserving)
- ✅ **Éticos** (Ethical)
- ✅ **Transparentes** (Transparent)

---

## Os 4 Pilares do AI TRiSM

```
┌─────────────────────────────────────────────────────────┐
│                    AI TRiSM Framework                    │
├───────────────┬───────────────┬───────────────┬──────────┤
│  Pilar 1:     │  Pilar 2:     │  Pilar 3:     │  Pilar 4:│
│ Explicabilidade│   ModelOps    │  Privacidade  │ Segurança│
│ e Monitoramento│               │   de IA       │ de IA    │
└───────────────┴───────────────┴───────────────┴──────────┘
```

---

## 🔍 Pilar 1: Explicabilidade e Monitoramento

### Objetivo
Tornar decisões de IA compreensíveis, auditáveis e monitoráveis.

### Componentes

#### 1.1 Explicabilidade (XAI - Explainable AI)

**Técnicas**:
- **SHAP (SHapley Additive exPlanations)**
  - Valores de contribuição de cada feature
  - Model-agnostic
  - Ferramenta: `shap` Python library

- **LIME (Local Interpretable Model-agnostic Explanations)**
  - Explicações locais por instance
  - Aproximação linear local
  - Ferramenta: `lime` Python library

- **Attention Visualizations**
  - Para transformers/LLMs
  - Heatmaps de atenção
  - Ferramenta: BertViz, Captum

- **Feature Importance**
  - Permutation importance
  - Feature ablation
  - Partial dependence plots

**Implementação**:
```python
import shap

# Explicar predição de LLM
explainer = shap.Explainer(model)
shap_values = explainer(input_text)
shap.plots.text(shap_values)
```

#### 1.2 Transparência

**Model Cards**:
- Documentação padronizada de modelos
- Campos: Uso intencionado, limitações, performance, vieses
- Template: Google Model Cards, Hugging Face

**System Cards** (OpenAI):
- Documentação de sistema completo
- Inclui: Arquitetura, dados, safety measures

**Datasheets for Datasets**:
- Documentação de datasets
- Origem, coleta, composição, uso recomendado

#### 1.3 Monitoramento Contínuo

**Métricas a Monitorar**:
- **Data Drift**: Mudança na distribuição de entrada
- **Concept Drift**: Mudança no conceito (X → Y)
- **Performance Degradation**: Queda de accuracy/F1
- **Bias Metrics**: Disparate impact, demographic parity
- **Latency**: Tempo de resposta
- **Error Rate**: Taxa de erros em produção

**Ferramentas**:
- **Evidently AI**: Monitoring e dashboards
- **WhyLabs**: Observability para ML
- **Fiddler AI**: Model monitoring
- **Arize AI**: ML observability

**Alertas**:
- Drift detection (statistical tests)
- Performance threshold breach
- Anomaly detection

### Categoria STRIDE
- **Repudiation**: Auditoria de decisões
- **Information Disclosure**: Transparência controlada

### Mapeamento OWASP LLM
- **LLM06**: Sensitive Information Disclosure (monitoring)
- **LLM09**: Overreliance (explicabilidade)

---

## ⚙️ Pilar 2: ModelOps (MLOps)

### Objetivo
Operacionalizar o ciclo de vida completo de modelos de IA/ML.

### Componentes

#### 2.1 Ciclo de Vida do Modelo

```
Desenvolvimento → Treinamento → Validação → Deployment → 
Monitoramento → Retreinamento → Decommissioning
```

#### 2.2 CI/CD para ML

**Pipeline Automatizado**:
1. **Data Validation**: Schema validation, drift detection
2. **Model Training**: Automated retraining on new data
3. **Model Testing**: Unit tests, integration tests
4. **Model Validation**: Performance thresholds
5. **Deployment**: Canary, blue-green, A/B testing
6. **Monitoring**: Real-time performance tracking

**Ferramentas**:
- **MLflow**: Experiment tracking, model registry
- **Kubeflow**: ML pipelines em Kubernetes
- **Weights & Biases**: Experiment management
- **DVC (Data Version Control)**: Versionamento de dados
- **ClearML**: MLOps platform

#### 2.3 Versionamento

**Versionar**:
- Código (Git)
- Dados (DVC, LakeFS)
- Modelos (MLflow Model Registry)
- Configs (YAML, Hydra)
- Experimentos (W&B, MLflow)

**Reprodutibilidade**:
- Seeds fixos
- Environment pinning (requirements.txt, Poetry)
- Docker containers
- Documentação completa

#### 2.4 Governança de Modelos

**Model Registry**:
- Catálogo centralizado de modelos
- Status: Development, Staging, Production, Archived
- Metadata: Owner, version, performance, approvals

**Approval Workflow**:
- Revisão por stakeholders
- Security scanning
- Bias auditing
- Performance validation

**Rollback Capability**:
- Reverter para versão anterior
- Hot-swap de modelos
- Zero-downtime deployment

#### 2.5 Feature Store

**Benefícios**:
- Reuso de features entre modelos
- Consistência treino/serving
- Low-latency serving

**Ferramentas**:
- **Feast**: Open-source feature store
- **Tecton**: Enterprise feature platform
- **AWS SageMaker Feature Store**
- **Databricks Feature Store**

### Categoria STRIDE
- **Tampering**: Versionamento previne adulteração
- **Repudiation**: Audit trail completo

### Mapeamento OWASP LLM
- **LLM03**: Training Data Poisoning (validação)
- **LLM05**: Supply Chain Vulnerabilities (governance)

---

## 🔒 Pilar 3: Privacidade de IA

### Objetivo
Proteger privacidade dos dados usados para treinar e servir modelos de IA.

### Componentes

#### 3.1 Differential Privacy (DP)

**Conceito**:
- Adicionar ruído aos dados/modelo
- Garantir que remoção de um indivíduo não afeta output
- Métrica: ε (epsilon) - privacy budget

**Técnicas**:
- **DP-SGD**: Differentially Private Stochastic Gradient Descent
- **PATE**: Private Aggregation of Teacher Ensembles
- **Local DP**: Ruído adicionado no cliente

**Implementação**:
```python
from opacus import PrivacyEngine

# PyTorch com Differential Privacy
privacy_engine = PrivacyEngine()
model, optimizer, dataloader = privacy_engine.make_private(
    module=model,
    optimizer=optimizer,
    data_loader=dataloader,
    noise_multiplier=1.0,
    max_grad_norm=1.0
)
```

**Ferramentas**:
- **Opacus** (PyTorch): Differential privacy library
- **TensorFlow Privacy**: DP para TensorFlow
- **Google DP Library**: C++ e Go

#### 3.2 Federated Learning

**Conceito**:
- Treinar modelo sem centralizar dados
- Modelo vai até os dados (edge devices)
- Apenas gradientes são agregados

**Arquitetura**:
```
[Device 1] ─┐
[Device 2] ─┼→ [Aggregation Server] → [Global Model]
[Device 3] ─┘
```

**Ferramentas**:
- **TensorFlow Federated**: FL framework
- **PySyft**: Privacy-preserving ML
- **Flower**: Federated learning framework
- **FedML**: Cross-silo and cross-device FL

#### 3.3 Homomorphic Encryption (HE)

**Conceito**:
- Computação em dados criptografados
- Resultado descriptografado é correto
- Permite ML inference sem ver dados

**Tipos**:
- **Partial HE**: Apenas uma operação (+ ou ×)
- **Somewhat HE**: Número limitado de operações
- **Fully HE**: Operações arbitrárias

**Ferramentas**:
- **SEAL** (Microsoft): FHE library
- **PALISADE**: Lattice crypto library
- **TenSEAL**: HE sobre tensores

#### 3.4 Secure Multi-Party Computation (SMPC)

**Conceito**:
- Múltiplas partes computam função sem revelar inputs
- Cada parte tem "share" secreto
- Resultado revelado apenas no final

**Use Cases**:
- Treinar modelo em dados de múltiplas organizações
- Inference em dados privados

**Ferramentas**:
- **CrypTen** (Facebook): MPC para PyTorch
- **TF Encrypted**: MPC para TensorFlow

#### 3.5 Data Minimization

**Princípios**:
- Coletar apenas o necessário
- Remover PII dos datasets
- Anonymization/Pseudonymization

**Técnicas**:
- **K-anonymity**: Grupos de k indivíduos indistinguíveis
- **L-diversity**: Diversidade de valores sensíveis
- **T-closeness**: Distribuição de valores sensíveis

**Ferramentas**:
- **ARX Data Anonymization Tool**
- **Microsoft Presidio**: PII detection e redaction

### Categoria STRIDE
- **Information Disclosure**: Proteção de dados sensíveis

### Mapeamento OWASP LLM
- **LLM06**: Sensitive Information Disclosure (privacy)
- **LLM03**: Training Data Poisoning (DP ajuda prevenir)

---

## 🛡️ Pilar 4: Segurança de Aplicações de IA

### Objetivo
Proteger modelos de IA contra ataques adversariais e garantir robustez.

### Componentes

#### 4.1 Adversarial Robustness

**Tipos de Ataques**:
- **Evasion Attacks**: Enganar modelo em inference
- **Poisoning Attacks**: Contaminar dados de treino
- **Model Extraction**: Roubar modelo via queries
- **Model Inversion**: Reconstruir dados de treino

**Adversarial Examples**:
```python
# FGSM Attack
epsilon = 0.03
perturbation = epsilon * sign(gradient)
adversarial_input = original_input + perturbation
```

#### 4.2 Defesas Adversariais

**Adversarial Training**:
- Treinar modelo com adversarial examples
- Aumenta robustez mas reduz accuracy

**Defensive Distillation**:
- Treinar modelo com soft labels
- Dificulta gradient-based attacks

**Input Sanitization**:
- Detectar e remover perturbações
- Técnicas: Denoising, compression

**Certified Defenses**:
- Garantias matemáticas de robustez
- Randomized smoothing

**Ferramentas**:
- **Adversarial Robustness Toolbox (ART)**: IBM
- **CleverHans**: Google
- **Foolbox**: University of Tübingen
- **TextAttack**: NLP adversarial attacks

#### 4.3 Input Validation para LLMs

**Validações**:
- Length limits
- Character filtering
- Prompt injection detection
- Malicious pattern matching

**Prompt Firewalls**:
- **Rebuff.ai**: Prompt injection detector
- **NeMo Guardrails**: NVIDIA
- **LangKit**: WhyLabs

#### 4.4 Model Hardening

**Técnicas**:
- **Quantization**: Reduz precisão (int8)
- **Pruning**: Remove neurônios desnecessários
- **Distillation**: Modelo menor treinado com modelo grande
- **Ensemble Methods**: Múltiplos modelos votam

#### 4.5 Secure Inference

**Isolamento**:
- Containers (Docker, Kubernetes)
- Sandboxing (gVisor, Firecracker)
- Network isolation

**Resource Limits**:
- CPU/GPU quotas
- Memory limits
- Timeout enforcement

**Monitoring**:
- Anomaly detection
- Intrusion detection
- Rate limiting

### Categoria STRIDE
- **Tampering**: Adversarial attacks
- **Denial of Service**: Resource exhaustion
- **Elevation of Privilege**: Model exploitation

### Mapeamento OWASP LLM
- **LLM01**: Prompt Injection (input validation)
- **LLM04**: Model DoS (resource limits)
- **LLM10**: Model Theft (secure inference)

---

## 🔄 Integração dos 4 Pilares

### Fluxo Completo

```
┌──────────────────────────────────────────────────────────┐
│ 1. Design com Explicabilidade                            │
│    → Model Cards, requisitos de transparência            │
└──────────────┬───────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────┐
│ 2. Desenvolvimento com Privacidade                       │
│    → DP, Federated Learning, data minimization           │
└──────────────┬───────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Deployment com ModelOps                               │
│    → CI/CD, versioning, A/B testing                      │
└──────────────┬───────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Operação com Segurança                                │
│    → Monitoring, hardening, adversarial defense          │
└──────────────┬───────────────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────────────┐
│ 5. Feedback Loop para Monitoramento                      │
│    → Drift detection, performance tracking, retrein      │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 Métricas de Sucesso

### Por Pilar

| Pilar | Métrica | Target | Ferramenta |
|-------|---------|--------|------------|
| **Explicabilidade** | % decisões explicáveis | > 90% | SHAP, LIME |
| **Explicabilidade** | Mean explanation time | < 2s | Captum |
| **ModelOps** | Deployment frequency | > 1x/semana | MLflow |
| **ModelOps** | MTTR (Mean Time to Restore) | < 1h | Kubeflow |
| **Privacidade** | Privacy budget (ε) | < 10 | Opacus |
| **Privacidade** | PII leakage rate | 0% | Presidio |
| **Segurança** | Adversarial accuracy | > 80% | ART |
| **Segurança** | Time to detect attack | < 5min | Evidently |

---

## 🛠️ Ferramentas Recomendadas

### Stack Completo

```
┌─────────────────────────────────────────────────────────┐
│ Explicabilidade: SHAP, LIME, Captum                     │
│ ModelOps: MLflow, Kubeflow, Weights & Biases            │
│ Privacidade: Opacus, TF Privacy, PySyft                 │
│ Segurança: ART, Rebuff.ai, NeMo Guardrails              │
│ Monitoring: Evidently AI, WhyLabs, Fiddler AI           │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Referências

- Gartner: AI TRiSM Framework
- NIST AI Risk Management Framework
- ISO/IEC 42001: AI Management System
- IEEE 7000 series: AI Standards

---

**Versão**: 2025.1  
**Última Atualização**: Outubro 2025  
**Licença**: CC BY-SA 4.0

