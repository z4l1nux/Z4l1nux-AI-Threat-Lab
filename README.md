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
