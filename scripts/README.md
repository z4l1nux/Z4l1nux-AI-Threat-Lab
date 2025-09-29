## 🚀 Scripts de Automação

Este diretório contém scripts para facilitar o desenvolvimento e deploy da **Threat Modeling Platform**.

### 📋 Scripts Disponíveis

#### **Linux/macOS:**
- `setup.sh` - Configuração inicial do projeto
- `dev.sh` - Execução em modo desenvolvimento
- `build.sh` - Build para produção

#### **Windows:**
- `setup.ps1` - Configuração inicial do projeto
- `dev.ps1` - Execução em modo desenvolvimento  
- `build.ps1` - Build para produção

### 🔧 Como Usar

#### **Setup Inicial:**
```bash
# Linux/macOS
./scripts/setup.sh

# Windows
.\scripts\setup.ps1
```

#### **Desenvolvimento:**
```bash
# Linux/macOS
./scripts/dev.sh

# Windows
.\scripts\dev.ps1
```

#### **Build de Produção:**
```bash
# Linux/macOS
./scripts/build.sh

# Windows
.\scripts\build.ps1
```

### 🌐 URLs de Acesso

Após executar os scripts, acesse:

- **Aplicação:** http://localhost:3000
- **Frontend Dev:** http://localhost:3001 (apenas em desenvolvimento)
- **Backend API:** http://localhost:3000/api

### 📝 Notas

- Os scripts verificam automaticamente as dependências
- Em caso de erro, execute `npm install` manualmente
- Para parar os servidores, pressione `Ctrl+C`
- A aplicação agora é 100% React + TypeScript