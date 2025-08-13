# Threat Modeling Co-Pilot

Uma ferramenta avançada de modelagem de ameaças que utiliza IA (Google Gemini) para analisar sistemas, identificar ameaças STRIDE, mapear para CAPEC e gerar visualizações interativas de árvores de ataque.

## 🚀 Funcionalidades Principais

### 📊 Análise de Ameaças com IA
- **Análise STRIDE completa**: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
- **Mapeamento CAPEC**: Integração com Common Attack Pattern Enumeration and Classification
- **Recomendações de mitigação**: Sugestões específicas para cada ameaça identificada
- **Classificação OWASP Top 10**: Mapeamento automático para as principais vulnerabilidades web

### 🌳 Árvore de Ataque Interativa
- **Visualização Mermaid**: Diagramas de fluxo interativos e responsivos
- **Organização por categoria STRIDE**: Estrutura clara e organizada
- **Quebra automática de linhas**: Texto bem formatado sem cortes
- **Cores diferenciadas**: Elementos visuais distintos para cada tipo de ameaça

### 🎛️ Controles de Visualização
- **Zoom interativo**: Controles de zoom in/out com mouse e botões
- **Navegação por arrasto**: Pan pelo diagrama com mouse
- **Ajuste automático**: Botão para ajustar à tela
- **Indicador de zoom**: Mostra porcentagem atual
- **Tooltips informativos**: Dicas nos controles

### 📤 Exportação de Imagens
- **PNG em alta qualidade**: Resolução 2x, anti-aliasing de alta qualidade
- **SVG vetorial**: Formato escalável com metadados
- **Download automático**: Salva com nome descritivo
- **Fundo limpo**: Ideal para impressão e apresentações

### 📄 Relatórios em PDF
- **Exportação completa**: Todo o relatório em formato PDF
- **Formatação profissional**: Layout limpo e organizado
- **Quebra automática de páginas**: Conteúdo bem distribuído

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Tailwind CSS
- **IA**: Google Gemini API (gemini-2.5-pro, gemini-2.5-flash)
- **Diagramas**: Mermaid.js 10.9.3
- **PDF**: jsPDF + autoTable
- **Markdown**: ReactMarkdown + remarkGfm

## 📋 Pré-requisitos

- Node.js 18+ 
- Chave da API Google Gemini

## ⚙️ Configuração

1. **Clone o repositório**:
```bash
git clone <repository-url>
cd threat-modeling-co-pilot-with-ai-3
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure a chave da API**:
```bash
# Crie um arquivo .env na raiz do projeto
echo "GEMINI_API_KEY=sua_chave_aqui" > .env
```

4. **Execute o projeto**:
```bash
npm run dev
```

## 🎯 Como Usar

### 1. Descreva seu Sistema
- Preencha a descrição completa do sistema
- Inclua informações sobre componentes, tecnologias, autenticação
- Adicione detalhes sobre dados sensíveis e integrações

### 2. Gere o Modelo de Ameaças
- Clique em "Gerar Modelo de Ameaças"
- A IA analisará automaticamente seu sistema
- Aguarde a geração do relatório completo

### 3. Visualize a Árvore de Ataque
- Clique em "🌳 Ver Árvore de Ataque" para visualização embarcada
- Use "🔗 Abrir em Nova Aba" para visualização completa
- Navegue com zoom e pan para explorar detalhes

### 4. Exporte os Resultados
- Use "📄 Baixar PDF" para o relatório completo
- Use "📷 PNG" ou "🎨 SVG" para a árvore de ataque
- Copie o link da árvore com "📋 Copiar Link"

## 🔧 Funcionalidades Avançadas

### Controles de Zoom
- **🔍+ / 🔍-**: Zoom in/out
- **🔄**: Reset do zoom
- **📐**: Ajustar à tela
- **Scroll do mouse**: Zoom com roda do mouse
- **Arrastar**: Pan pelo diagrama

### Qualidade de Exportação
- **PNG**: Resolução 2400x1600px mínimo, anti-aliasing de alta qualidade
- **SVG**: Formato vetorial escalável, metadados incluídos
- **Fundo branco**: Ideal para impressão e apresentações

### Quebra de Linhas Inteligente
- **Elementos**: Máximo 20 caracteres por linha
- **CAPEC**: Máximo 25 caracteres por linha
- **Cenários**: Máximo 30 caracteres por linha
- **Quebra por palavras**: Não corta palavras no meio

## 🎨 Interface

### Design Responsivo
- **Desktop**: Layout otimizado para telas grandes
- **Tablet**: Adaptação para telas médias
- **Mobile**: Interface mobile-friendly

### Tema Escuro
- **Cores**: Preto e amarelo para melhor contraste
- **Acessibilidade**: Alto contraste para leitura
- **Profissional**: Visual clean e moderno

## 🔒 Segurança

- **Validação de entrada**: Sanitização de dados do usuário
- **SRI (Subresource Integrity)**: Verificação de integridade de scripts externos
- **HTTPS**: Recomendado para produção
- **Variáveis de ambiente**: Chaves de API seguras

## 📈 Melhorias Recentes

### v3.0 - Árvore de Ataque Interativa
- ✅ Visualização Mermaid completa
- ✅ Controles de zoom e navegação
- ✅ Exportação PNG/SVG em alta qualidade
- ✅ Quebra automática de linhas
- ✅ Cores diferenciadas por categoria
- ✅ Interface responsiva e moderna

### v2.0 - Análise STRIDE/CAPEC
- ✅ Mapeamento completo STRIDE → CAPEC
- ✅ Recomendações de mitigação
- ✅ Classificação OWASP Top 10
- ✅ Relatórios em PDF
- ✅ Interface em português

### v1.0 - Base IA
- ✅ Integração Google Gemini
- ✅ Análise automática de sistemas
- ✅ Identificação de ameaças
- ✅ Interface web moderna

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## ⚠️ Aviso Legal

Esta é uma ferramenta conceitual para fins educacionais e de desenvolvimento. **Sempre valide o conteúdo gerado por IA com especialistas em segurança** antes de usar em ambientes de produção.

## 🆘 Suporte

- **Issues**: Reporte bugs e solicite features no GitHub
- **Documentação**: Consulte este README e os comentários no código
- **Comunidade**: Participe das discussões no repositório

---

**Desenvolvido com ❤️ e IA para a comunidade de segurança**
