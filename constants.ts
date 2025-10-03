import { StrideCategory } from './types';

export const APP_TITLE = "Z4l1nux AI Threat Lab";
export const STRIDE_CATEGORIES_LIST = Object.values(StrideCategory);

export const INITIAL_SYSTEM_INFO = {
  systemName: "Aplicação Web Exemplo",
  systemVersion: "1.0.0",
  generalDescription: "Uma aplicação web padrão com frontend, API backend e banco de dados de usuários. Permite que usuários se registrem, façam login e gerenciem seus perfis.",
  components: "Frontend React, API Backend Node.js, Banco de Dados PostgreSQL, Reverse Proxy Nginx",
  sensitiveData: "Credenciais de usuário (senhas com hash), Informações Pessoais Identificáveis (PII) como email e nome.",
  technologies: "React, Node.js, Express.js, PostgreSQL, Docker, AWS S3 para ativos estáticos.",
  authentication: "Autenticação baseada em JWT. Login com nome de usuário/senha.",
  userProfiles: "Usuário Registrado, Administrador",
  externalIntegrations: "Serviço de email de terceiros (ex: SendGrid) para notificações. Nenhuma outra integração externa significativa.",
};

export const GEMINI_API_KEY_CHECK_MSG = "Nota: Esta aplicação requer que a variável de ambiente GEMINI_API_KEY seja configurada para que as funcionalidades de IA funcionem. Se não estiver configurada, a geração assistida por IA falhará.";


