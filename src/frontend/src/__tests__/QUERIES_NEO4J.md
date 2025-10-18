# 🔍 Guia de Queries Neo4j para Z4l1nux AI Threat Lab

## 📊 **Queries Básicas de Visualização**

### 1. Ver TODOS os documentos com estatísticas
```cypher
MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
RETURN d.name as Documento, 
       d.uploadedAt as DataUpload,
       count(c) as TotalChunks,
       d.size as TamanhoBytes,
       d.hash as HashConteudo
ORDER BY d.uploadedAt DESC
```

### 2. Ver chunks de um documento específico (com preview)
```cypher
MATCH (d:Document {name: "capec-stride-mapping.md"})-[:CONTAINS]->(c:Chunk)
RETURN c.index as ChunkIndex,
       substring(c.content, 0, 200) as PreviewConteudo,
       c.size as TamanhoBytes
ORDER BY c.index
LIMIT 10
```

### 3. Buscar documentos por palavra-chave no conteúdo
```cypher
MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
WHERE c.content CONTAINS "Spoofing" 
   OR c.content CONTAINS "CAPEC-"
   OR c.content CONTAINS "STRIDE"
RETURN d.name as Documento,
       c.index as Chunk,
       substring(c.content, 0, 250) as Preview
LIMIT 15
```

### 4. Estatísticas gerais do RAG
```cypher
MATCH (d:Document)
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
RETURN count(DISTINCT d) as TotalDocumentos,
       count(c) as TotalChunks,
       sum(d.size) as TamanhoTotalBytes,
       avg(c.size) as MediaTamanhoChunk
```

## 🔎 **Queries para Validar Mapeamento STRIDE-CAPEC**

### 5. Ver CAPECs disponíveis para cada categoria STRIDE
```cypher
MATCH (d:Document {name: "capec-stride-mapping.md"})-[:CONTAINS]->(c:Chunk)
WHERE c.content CONTAINS "##" 
   OR c.content CONTAINS "CAPEC-"
   OR c.content CONTAINS "Spoofing"
   OR c.content CONTAINS "Tampering"
RETURN c.index as ChunkIndex,
       c.content as Conteudo
ORDER BY c.index
LIMIT 20
```

### 6. Buscar CAPECs específicos por ID
```cypher
MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
WHERE c.content CONTAINS "CAPEC-113" 
   OR c.content CONTAINS "CAPEC-212"
   OR c.content CONTAINS "CAPEC-590"
RETURN d.name as Documento,
       c.index as Chunk,
       c.content as Detalhes
```

### 7. Ver todas as categorias STRIDE documentadas
```cypher
MATCH (d:Document {name: "capec-stride-mapping.md"})-[:CONTAINS]->(c:Chunk)
WHERE c.content CONTAINS "Information Disclosure"
   OR c.content CONTAINS "Spoofing"
   OR c.content CONTAINS "Tampering"
   OR c.content CONTAINS "Repudiation"
   OR c.content CONTAINS "Denial of Service"
   OR c.content CONTAINS "Elevation of Privilege"
RETURN c.index as Chunk,
       substring(c.content, 0, 300) as Categoria
ORDER BY c.index
```

## 🎯 **Queries para Validar Sistema Modelado**

### 8. Ver informações do sistema modelado mais recente
```cypher
MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
WHERE d.name CONTAINS "Sistema_"
RETURN d.name as Sistema,
       d.uploadedAt as DataModelagem,
       count(c) as Chunks,
       substring(d.content, 0, 500) as PreviewSistema
ORDER BY d.uploadedAt DESC
LIMIT 3
```

### 9. Buscar informações técnicas do sistema
```cypher
MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
WHERE d.name CONTAINS "Sistema_"
  AND (c.content CONTAINS "TECNOLOGIAS"
   OR c.content CONTAINS "COMPONENTES"
   OR c.content CONTAINS "DADOS SENSÍVEIS")
RETURN d.name as Sistema,
       c.index as Chunk,
       c.content as InformacoesTecnicas
ORDER BY d.uploadedAt DESC
LIMIT 5
```

## 🧹 **Queries de Manutenção**

### 10. Deletar um documento específico e seus chunks
```cypher
// Deletar um documento específico pelo nome exato
MATCH (d:Document {name: "nome-do-documento.md"})
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, d
RETURN "Documento deletado" as Status
```

**Exemplo prático:**
```cypher
// Deletar documento do SuperMax
MATCH (d:Document {name: "Sistema_SuperMax Retail Management Platform (v3.2.1)_2025-10-01"})
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, d
RETURN "Documento SuperMax deletado" as Status
```

### 10b. Deletar todos os documentos que contêm um termo no nome
```cypher
// CUIDADO: Deleta TODOS os documentos cujo nome contenha o termo
MATCH (d:Document)
WHERE d.name CONTAINS "SuperMax"
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, d
RETURN count(d) as DocumentosDeletados
```

### 10c. Deletar versões antigas de um sistema (manter só a mais recente)
```cypher
// Deletar todas as versões antigas de um sistema, mantendo apenas a mais recente
MATCH (d:Document)
WHERE d.name CONTAINS "Sistema_Growth Campaigns"
WITH d ORDER BY d.uploadedAt DESC
WITH collect(d) as docs
WITH docs[1..] as oldDocs  // Pega todos exceto o primeiro (mais recente)
UNWIND oldDocs as doc
OPTIONAL MATCH (doc)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, doc
RETURN count(doc) as VersõesAntigasDeletadas
```

### 10d. ⚠️ Visualizar o que será deletado ANTES de deletar
```cypher
// SEMPRE execute esta query PRIMEIRO para confirmar o que será deletado!
MATCH (d:Document)
WHERE d.name CONTAINS "SuperMax"
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
RETURN d.name as Documento,
       d.uploadedAt as DataUpload,
       count(c) as TotalChunks,
       d.size as TamanhoBytes
```

### 11. Identificar documentos duplicados (mesmo nome)
```cypher
MATCH (d:Document)
WITH d.name as NomeDoc, collect(d) as docs, count(d) as total
WHERE total > 1
RETURN NomeDoc, total, [doc IN docs | doc.uploadedAt] as Datas
```

### 12. Limpar documentos antigos (CUIDADO!)
```cypher
// ATENÇÃO: Esta query DELETA dados!
// Deleta versões antigas de documentos duplicados (mantém a mais recente)
MATCH (d:Document)
WITH d.name as nome, collect(d) as docs
WHERE size(docs) > 1
WITH nome, docs, [doc IN docs | doc.uploadedAt] as datas
UNWIND docs as doc
WITH nome, doc, datas, max(datas) as dataRecente
WHERE doc.uploadedAt < dataRecente
OPTIONAL MATCH (doc)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, doc
RETURN count(doc) as DocumentosDeletados
```

### 13. Ver tamanho de embeddings (validar vetorização)
```cypher
MATCH (c:Chunk)
WHERE c.embedding IS NOT NULL
RETURN count(c) as ChunksComEmbedding,
       size(c.embedding) as DimensaoEmbedding
LIMIT 1
```

## 🔬 **Queries Avançadas para Debugging**

### 14. Ver metadata dos chunks
```cypher
MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
RETURN d.name as Documento,
       c.index as Chunk,
       c.metadata as Metadata
LIMIT 10
```

### 15. Verificar documentos sem chunks (problema!)
```cypher
MATCH (d:Document)
WHERE NOT (d)-[:CONTAINS]->(:Chunk)
RETURN d.name as DocumentoSemChunks,
       d.uploadedAt as Data,
       d.size as Tamanho
```

### 16. Ver estrutura completa do grafo
```cypher
CALL db.schema.visualization()
```

### 17. Busca vetorial manual (simular RAG)
```cypher
// Esta query NÃO funciona diretamente no Neo4j Browser
// Use o endpoint /api/search do backend para busca vetorial real
MATCH (c:Chunk)
WHERE c.content CONTAINS "threat modeling"
RETURN c.documentId as Documento,
       c.index as Chunk,
       substring(c.content, 0, 200) as Preview
LIMIT 10
```

## 📝 **Como Executar no Neo4j Browser**

1. Acesse: **http://localhost:7474**
2. Conecte com:
   - **Bolt URL**: `bolt://localhost:7687`
   - **Usuário**: `neo4j`
   - **Senha**: [use a senha configurada no seu .env.local]
3. Cole a query no campo de texto
4. Pressione **Ctrl+Enter** ou clique no botão ▶️

## 🎯 **Queries Essenciais para Validação RAG**

### ✅ Verificar se mapeamento STRIDE-CAPEC está carregado:
```cypher
MATCH (d:Document {name: "capec-stride-mapping.md"})-[:CONTAINS]->(c:Chunk)
RETURN count(c) as TotalChunks
```
**Esperado**: 40 chunks

### ✅ Verificar se sistema foi processado:
```cypher
MATCH (d:Document)
WHERE d.name CONTAINS "Sistema_"
RETURN d.name as Sistema, d.uploadedAt as Data
ORDER BY d.uploadedAt DESC
LIMIT 3
```

### ✅ Validar embeddings (vetorização):
```cypher
MATCH (c:Chunk)
WHERE c.embedding IS NOT NULL
RETURN count(c) as ChunksVetorizados,
       size(head(collect(c.embedding))) as DimensaoVetor
```
**Esperado**: DimensaoVetor = 768 (Gemini gemini-embedding-001)

---

## 🔗 **Endpoints Backend para Busca RAG**

Enquanto o Neo4j Browser permite visualizar dados, a **busca semântica vetorial** deve ser feita via backend:

```bash
# Busca RAG com contexto
curl -X POST http://localhost:3001/api/search/context \
  -H "Content-Type: application/json" \
  -d '{"query": "threat modeling Spoofing attacks", "limit": 5}'

# Estatísticas do sistema
curl http://localhost:3001/api/statistics
```

---

## 🎯 **Exemplos Práticos de Limpeza**

### 🗑️ **Limpar documentos de teste do SuperMax:**
```cypher
// 1. Ver o que será deletado
MATCH (d:Document)
WHERE d.name CONTAINS "SuperMax"
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
RETURN d.name as Documento, 
       d.uploadedAt as Data,
       count(c) as Chunks
ORDER BY d.uploadedAt DESC

// 2. Confirmar e deletar
MATCH (d:Document)
WHERE d.name CONTAINS "SuperMax"
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, d
RETURN "SuperMax removido" as Status
```

### 🔄 **Manter apenas a versão mais recente de cada sistema:**
```cypher
// Para Growth Campaigns - manter só a última versão
MATCH (d:Document)
WHERE d.name CONTAINS "Sistema_Growth Campaigns"
WITH d ORDER BY d.uploadedAt DESC
WITH collect(d) as docs
WITH docs[1..] as oldDocs
UNWIND oldDocs as doc
OPTIONAL MATCH (doc)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, doc
RETURN count(doc) as VersõesAntigasDeletadas
```

### 🧹 **Limpeza completa (resetar TODA a base):**
```cypher
// ⚠️ ATENÇÃO: Remove TODOS os documentos e chunks da base!
// Use apenas se tiver certeza absoluta
MATCH (d:Document)
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, d
RETURN count(d) as DocumentosDeletados
```

### 📊 **Listar todos os sistemas processados:**
```cypher
MATCH (d:Document)
WHERE d.name STARTS WITH "Sistema_"
RETURN d.name as Sistema, 
       d.uploadedAt as Processado,
       count{(d)-[:CONTAINS]->(:Chunk)} as Chunks
ORDER BY d.uploadedAt DESC
```

### 🔍 **Deletar por ID específico:**
```cypher
// Útil quando você sabe o ID exato do documento
MATCH (d:Document {id: "c8600e0ac3fb6b247a522154657e4248"})
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, d
RETURN "Documento deletado por ID" as Status
```

### 🎯 **Deletar documentos mais antigos que uma data:**
```cypher
// Deletar documentos anteriores a uma data específica
MATCH (d:Document)
WHERE d.uploadedAt < "2025-10-01"
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, d
RETURN count(d) as DocumentosAntigosDeletados
```

---

## ⚠️ **Dicas de Segurança para Deleção**

✅ **SEMPRE visualize antes de deletar** - Use a query 10d  
✅ **Use nomes exatos** quando possível - `{name: "exato.md"}`  
✅ **Teste com RETURN primeiro** - Troque DELETE por RETURN para ver o que pegaria  
✅ **Faça backup** - Se possível, exporte antes de operações destrutivas  
❌ **Cuidado com CONTAINS** - Pode pegar mais documentos que o esperado  
❌ **Não use DETACH DELETE sem MATCH** - Pode deletar tudo!

---

## 🔄 **Workflow Recomendado de Limpeza**

1. **📋 Listar** - Veja o que existe
```cypher
MATCH (d:Document)
RETURN d.name, d.uploadedAt, count{(d)-[:CONTAINS]->(:Chunk)} as Chunks
ORDER BY d.uploadedAt DESC
```

2. **🔍 Visualizar** - Veja o que será deletado
```cypher
MATCH (d:Document)
WHERE d.name CONTAINS "SuperMax"
RETURN d.name, count{(d)-[:CONTAINS]->(:Chunk)} as Chunks
```

3. **🗑️ Deletar** - Execute a deleção
```cypher
MATCH (d:Document)
WHERE d.name CONTAINS "SuperMax"
OPTIONAL MATCH (d)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, d
```

4. **✅ Confirmar** - Verifique se foi deletado
```cypher
MATCH (d:Document)
WHERE d.name CONTAINS "SuperMax"
RETURN count(d) as Restantes  // Deve retornar 0
```

