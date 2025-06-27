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

## Licença
MIT
