# 📜 Scripts de Automação - Threat Modeling

Este diretório contém scripts para automatizar tarefas comuns do projeto.

## 🪟 **Windows (PowerShell)**

### **setup.ps1** - Configuração Inicial
```powershell
.\scripts\setup.ps1
```
- Instala dependências do backend e frontend
- Compila o projeto completo
- Configura tudo para desenvolvimento

### **dev.ps1** - Desenvolvimento
```powershell
.\scripts\dev.ps1
```
- Inicia backend e frontend em modo desenvolvimento
- Hot reload ativado
- URLs disponíveis:
  - Backend: http://localhost:3000
  - Frontend: http://localhost:3001
  - Legacy: http://localhost:3000/legacy

### **build.ps1** - Build de Produção
```powershell
.\scripts\build.ps1
```
- Compila backend TypeScript
- Build do frontend React
- Gera arquivos otimizados para produção

## 🐧 **Linux/Mac (Bash)**

### **setup.sh** - Configuração Inicial
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

## 🔧 **Execução de Política PowerShell**

Se você receber erro de política de execução no PowerShell:

```powershell
# Verificar política atual
Get-ExecutionPolicy

# Permitir execução de scripts (temporário)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Ou executar com bypass
PowerShell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

## 📋 **Comandos NPM Alternativos**

Se preferir usar comandos NPM diretamente:

```bash
# Instalar tudo
npm run install-deps

# Desenvolvimento
npm run dev

# Build
npm run build

# Apenas backend
npm run dev:backend

# Apenas frontend  
npm run dev:frontend
```

## 🆘 **Troubleshooting**

### **Erro: "npm não encontrado"**
```powershell
# Verificar se Node.js está instalado
node --version
npm --version

# Se não estiver, instalar Node.js de: https://nodejs.org
```

### **Erro: "Dependências não encontradas"**
```powershell
# Limpar cache e reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force src/client/node_modules
npm install
```

### **Erro: "Porta já em uso"**
```powershell
# Verificar processos na porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

## 🎯 **Fluxo Recomendado**

1. **Primeira vez:**
   ```powershell
   .\scripts\setup.ps1
   ```

2. **Desenvolvimento diário:**
   ```powershell
   .\scripts\dev.ps1
   ```

3. **Deploy:**
   ```powershell
   .\scripts\build.ps1
   npm start
   ```
