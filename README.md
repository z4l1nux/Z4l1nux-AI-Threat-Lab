# Threat Modeling Co-Pilot

## Objetivo do Sistema

O **Threat Modeling Co-Pilot** é uma plataforma inteligente para modelagem de ameaças, que utiliza IA (Google Gemini) para analisar sistemas, gerar relatórios de ameaças STRIDE, mapear para CAPEC, sugerir mitigações e exportar relatórios completos em PDF. O objetivo é facilitar e acelerar o processo de modelagem de ameaças para desenvolvedores, arquitetos e equipes de segurança.

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta e chave de API do Google Gemini (https://aistudio.google.com/app/apikey)

## Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repo>
   cd threat-modeling-co-pilot-with-ai-3
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configure a chave da API Gemini:
   - Renomeie o arquivo `.env.local.example` para `.env.local`:
     ```bash
     mv .env.local.example .env.local
     ```
   - Edite o arquivo `.env.local` e adicione sua chave:
     ```env
     GEMINI_API_KEY=coloque_sua_chave_aqui
     ```

## Uso

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

2. Acesse no navegador:
   ```
   http://localhost:5173
   ```

3. Preencha as informações do sistema, incluindo a versão, descrição completa, e clique em "Gerar Modelo de Ameaças".

4. Analise o relatório web, exporte para PDF e refine com IA conforme necessário.

## Funcionalidades
- Entrada detalhada do sistema (componentes, dados sensíveis, tecnologias, integrações, etc.)
- Análise automática de ameaças STRIDE + CAPEC
- Sugestão de mitigação, impacto e mapeamento OWASP Top 10
- Exportação de relatório em PDF
- Refinamento do relatório com IA Gemini

## Observações
- É obrigatório configurar a chave da API Gemini para uso das funcionalidades de IA.
- O arquivo de mapeamento STRIDE-CAPEC está em `public/data/mapeamento-stride-capec-pt.json`.

## Criando um Gem no Gemini para Facilitar a Modelagem

Para facilitar a geração do prompt correto que será usado no Threat Modeling Copilot, você pode criar um Gem personalizado no [Gemini](https://gemini.google.com). Siga os passos:

1. Acesse [gemini.google.com](https://gemini.google.com)
2. Clique no ícone de "Gem Manager" ou "Criar Gem"
3. Crie um novo Gem com o nome: **"Threat Modeling Copilot - System Overview"**
4. Cole o template abaixo nas instruções do Gem:

### **Sugestão de Prompt para Modelagem de Ameaças: [Nome do Sistema]**

**Nome do Sistema:** [Nome do seu sistema. Ex: FinDataFlow Engine, EduConnect Hub]

**Objetivo:** [Descrição concisa do propósito principal do sistema. O que ele faz? Qual problema ele resolve?]

**Componentes Chave:**
* [Liste os principais módulos, microsserviços, aplicações (frontends/backends), gateways, etc. Ex: Portal do Aluno, Serviço de Gerenciamento de Cursos, Cluster de Processamento EC2, Dispositivos IoT.]
* [Adicione mais pontos conforme necessário, detalhando a arquitetura.]

**Dados Críticos:**
* [Liste os tipos de dados mais sensíveis que o sistema armazena, processa ou transmite. Ex: Dados Pessoais Identificáveis (PII), Dados de Transações Financeiras, Histórico Médico, Propriedade Intelectual, Credenciais de Acesso.]
* [Especifique a sensibilidade: Confidencialidade, Integridade, Disponibilidade.]

**Tecnologias e Infraestrutura:**
* [Liste as principais tecnologias usadas (linguagens, frameworks, bancos de dados, message brokers). Ex: Python, Java, Spring Boot, PostgreSQL, MongoDB, Kafka.]
* [Descreva a infraestrutura de deployment (cloud provider, orquestração, serviços específicos). Ex: AWS EC2, S3, Kubernetes, Azure IoT Hub.]
* [Mencione aspectos de segurança da tecnologia. Ex: TLS, OAuth, Criptografia em repouso/trânsito.]

**Fluxos de Usuário/Processo:**
* [Descreva os principais atores (usuários, sistemas externos) e como eles interagem com o sistema. Ex: Aluno acessa aulas, Engenheiro de Dados gerencia pipeline, Dispositivo IoT envia telemetria.]
* [Liste os fluxos de dados mais importantes e as interações críticas.]

**[OPCIONAL] Cenário de Ameaça Específico (se aplicável, para prompts baseados em CVE/Incidentes):**
* [Descreva um cenário hipotético ou real onde uma vulnerabilidade específica é explorada, levando a um incidente. Se não houver uma CVE específica, esta seção pode ser omitida ou generalizada como um "Cenário de Risco" principal.]
* [Ex: "Um atacante explora a CVE-XXXX-YYYY no componente Z para obter acesso W, resultando em X."]

**Pergunta para a Modelagem de Ameaças:**

Com base no objetivo do sistema, seus componentes, dados críticos e fluxos de usuário [e no cenário de ameaça descrito, se aplicável]:

* Quais são os principais **ativos** a serem protegidos (incluindo dados, funcionalidades, reputação, infraestrutura)?
* Quais **ameaças** (utilizando o modelo **STRIDE**) poderiam explorar vulnerabilidades no sistema? (Ex: Spoofing de identidade, Tampering de dados, Information Disclosure de informações sensíveis, Denial of Service, Elevação de Privilégio, Repudiação).
* Quais **controles** de segurança (mitigações) você sugere para prevenir essas ameaças, com foco em [especifique áreas-chave como: segurança na nuvem, autenticação/autorização, proteção de dados, hardening de endpoints, moderação de conteúdo, etc.] e como esses controles se alinham com os princípios de segurança?

Após criar o Gem, você pode usá-lo para gerar automaticamente prompts estruturados que serão mais eficazes quando colados no Threat Modeling Copilot.

## Sugestão de Descrição Completa do Sistema

### Exemplo de Prompt para Modelagem de Ameaças: Sistema de Telemedicina

**Nome do Sistema:** HealthConnect

**Objetivo:** Plataforma de telemedicina para agendamento e realização de consultas online, com gerenciamento de prontuários eletrônicos (PEP) e prescrições digitais.

**Componentes Chave:**
- **Frontends:** Portal do Paciente (Web/Móvel) e Portal do Médico (Web).
- **Backends:** API Central, serviços de Agendamento, Teleconsulta (WebRTC), PEP e Prescrição Digital.
- **Dados:** Bancos de Dados de perfil de usuário (MongoDB) e Clínico confidencial (PostgreSQL).
- **Integrações:** Gateways de pagamento, SMS/E-mail e serviços de assinatura digital.

**Dados Críticos:**
- **Dados Pessoais de Saúde (DPH):** Prontuários, histórico médico, resultados de exames e prescrições.
- **Dados Sensíveis:** Informações de identificação do paciente (CPF, nome), credenciais e tokens de pagamento.

**Tecnologias e Infraestrutura:**
- **Tecnologias:** Vue.js, Flutter, Python, Golang, WebRTC, Kafka.
- **Infraestrutura:** Containers (Docker), Orquestração (Kubernetes) no Azure.
- **Segurança:** TLS 1.3, criptografia de ponta a ponta e assinaturas digitais (X.509).

**Fluxos de Usuário:**
- **Paciente:** Agenda, participa de consultas e acessa dados de saúde.
- **Médico:** Gerencia agenda, acessa prontuários e emite prescrições.
- **Administrador:** Gerencia usuários e monitora o sistema.

## Licença
MIT
