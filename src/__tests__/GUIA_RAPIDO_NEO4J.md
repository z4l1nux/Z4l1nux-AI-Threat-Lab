# 🚀 Guia Rápido: Neo4j + RAG

## 🔗 **Acesso Rápido**

### **Neo4j Browser**
```
URL: http://localhost:7474
Usuário: neo4j
Senha: [configure sua senha no .env.local]
```

⚠️ **IMPORTANTE:** Use a senha configurada em seu arquivo `.env.local` (variável `NEO4J_PASSWORD`)

---

## ⚡ **Top 5 Queries Mais Úteis**

### 1. **📊 Estatísticas Gerais**
```cypher
MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
RETURN count(DISTINCT d) as Documentos,
       count(c) as Chunks,
       sum(d.size) as TotalBytes
```

### 2. **🔍 Ver Todos os Documentos**
```cypher
MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
RETURN d.name as Nome, 
       d.uploadedAt as Upload,
       count(c) as Chunks
ORDER BY d.uploadedAt DESC
```

### 3. **🎯 Ver CAPECs de uma Categoria STRIDE**
```cypher
MATCH (d:Document {name: "capec-stride-mapping.md"})-[:CONTAINS]->(c:Chunk)
WHERE c.content CONTAINS "Spoofing"  // ou Tampering, Information Disclosure, etc.
RETURN c.content
LIMIT 3
```

### 4. **📄 Ver Sistema Modelado**
```cypher
MATCH (d:Document)
WHERE d.name CONTAINS "Sistema_"
RETURN d.name, 
       d.uploadedAt,
       substring(d.content, 0, 500) as Preview
ORDER BY d.uploadedAt DESC
LIMIT 3
```

### 5. **🧹 Limpar Duplicatas (SE NECESSÁRIO)**
```cypher
// ⚠️ CUIDADO: Esta query deleta dados!
MATCH (d:Document)
WITH d.name as nome, collect(d) as docs
WHERE size(docs) > 1
WITH nome, docs, [doc IN docs | doc.uploadedAt] as datas
UNWIND docs as doc
WITH doc, datas, max(datas) as dataRecente
WHERE doc.uploadedAt < dataRecente
OPTIONAL MATCH (doc)-[:CONTAINS]->(c:Chunk)
DETACH DELETE c, doc
RETURN count(doc) as Deletados
```

---

## 🔬 **Queries de Debugging**

### **Verificar Embeddings**
```cypher
MATCH (c:Chunk)
WHERE c.embedding IS NOT NULL
RETURN count(c) as ChunksVetorizados,
       size(head(collect(c.embedding))) as Dimensao
```
✅ **Esperado**: Dimensao = 768

### **Encontrar Chunks Sem Embeddings**
```cypher
MATCH (c:Chunk)
WHERE c.embedding IS NULL
RETURN count(c) as ProblemaChunks
```
✅ **Esperado**: 0

### **Ver Documentos Sem Chunks (Problema!)**
```cypher
MATCH (d:Document)
WHERE NOT (d)-[:CONTAINS]->(:Chunk)
RETURN d.name, d.uploadedAt
```
✅ **Esperado**: Sem resultados

---

## 🎯 **Busca de CAPECs por Categoria**

### **Spoofing**
```cypher
MATCH (c:Chunk)
WHERE c.content CONTAINS "CAPEC-156"  // Engage In Deceptive Interactions
   OR c.content CONTAINS "CAPEC-148"  // Content Spoofing
RETURN c.content
```

### **Tampering**
```cypher
MATCH (c:Chunk)
WHERE c.content CONTAINS "Tampering"
   OR c.content CONTAINS "data modification"
RETURN substring(c.content, 0, 300)
LIMIT 5
```

### **Information Disclosure**
```cypher
MATCH (c:Chunk)
WHERE c.content CONTAINS "CAPEC-129"  // Pointer Manipulation
   OR c.content CONTAINS "CAPEC-157"  // Sniffing Attacks
RETURN c.content
```

### **Denial of Service**
```cypher
MATCH (c:Chunk)
WHERE c.content CONTAINS "Denial of Service"
   OR c.content CONTAINS "availability"
RETURN substring(c.content, 0, 300)
LIMIT 5
```

### **Elevation of Privilege**
```cypher
MATCH (c:Chunk)
WHERE c.content CONTAINS "Elevation of Privilege"
   OR c.content CONTAINS "privilege escalation"
RETURN substring(c.content, 0, 300)
LIMIT 5
```

### **Repudiation**
```cypher
MATCH (c:Chunk)
WHERE c.content CONTAINS "Repudiation"
   OR c.content CONTAINS "non-repudiation"
RETURN substring(c.content, 0, 300)
LIMIT 5
```

---

## 📊 **Visualização Gráfica**

### **Ver Estrutura Completa**
```cypher
MATCH (d:Document)-[:CONTAINS]->(c:Chunk)
RETURN d, c
LIMIT 100
```
**Dica**: Clique nos nós para ver detalhes

### **Ver Apenas um Documento**
```cypher
MATCH (d:Document {name: "capec-stride-mapping.md"})-[:CONTAINS]->(c:Chunk)
RETURN d, c
LIMIT 40
```

---

## 🔧 **Manutenção**

### **Ver Tamanho dos Chunks**
```cypher
MATCH (c:Chunk)
RETURN min(c.size) as MenorChunk,
       max(c.size) as MaiorChunk,
       avg(c.size) as MediaChunk,
       count(c) as TotalChunks
```

### **Documentos Ordenados por Data**
```cypher
MATCH (d:Document)
RETURN d.name, 
       d.uploadedAt,
       d.size
ORDER BY d.uploadedAt DESC
```

---

## 🎨 **Dicas de Uso**

1. **Explore Visualmente**: Use queries gráficas para entender a estrutura
2. **Limite Resultados**: Sempre use `LIMIT` para evitar sobrecarga
3. **Busque por Palavras-chave**: Use `CONTAINS` para encontrar conteúdo específico
4. **Verifique Metadata**: Campo `metadata` dos chunks tem informações úteis

---

## 🚨 **Solução de Problemas**

### **Problema: "Nenhum resultado encontrado"**
✅ **Solução**: Verifique se o sistema RAG está inicializado
```bash
curl http://localhost:3001/api/initialize -X POST
```

### **Problema: "Duplicatas de documentos"**
✅ **Solução**: Backend agora atualiza ao invés de duplicar (correção aplicada)

### **Problema: "Chunks sem embeddings"**
✅ **Solução**: Reprocessar documento via upload
```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -F "document=@capec-stride-mapping.md"
```

---

## 📚 **Documentação Completa**

- **Queries Detalhadas**: `QUERIES_NEO4J.md`
- **Validação RAG**: `VALIDACAO_RAG.md`
- **Testes Visuais**: `TESTE_RAG_VISUAL.md`

---

## ✅ **Checklist de Validação**

```cypher
// 1. Sistema tem documentos?
MATCH (d:Document) RETURN count(d) as total;
// ✅ Esperado: > 0

// 2. Mapeamento STRIDE-CAPEC carregado?
MATCH (d:Document {name: "capec-stride-mapping.md"}) RETURN d.name;
// ✅ Esperado: 1 resultado

// 3. Chunks vetorizados?
MATCH (c:Chunk) WHERE c.embedding IS NOT NULL RETURN count(c);
// ✅ Esperado: = total de chunks

// 4. Sem duplicatas?
MATCH (d:Document)
WITH d.name as nome, count(d) as total
WHERE total > 1
RETURN nome;
// ✅ Esperado: 0 resultados
```

