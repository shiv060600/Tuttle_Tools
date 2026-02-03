# Sage Documentation RAG Ingestion System

## 🎯 Overview

This ingestion system processes Sage 300 PDF documentation and creates a **Retrieval-Augmented Generation (RAG)** system that allows you to query the documentation using natural language.

## 🧠 How It Works (The Complete Picture)

### Architecture Diagram
```
┌─────────────────────┐
│   PDF Documents     │  (Sage 300 User Guides)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  SimpleDirectoryReader │  Reads & chunks PDFs
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   BGE-M3 Model      │  Ollama (localhost:11434)
│   (Embedding Gen)   │  Converts text → 1024-dim vectors
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  PostgreSQL         │  Stores vectors with pgvector
│  sage_docs table    │  Fast similarity search (HNSW index)
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Query API          │  (You'll create this)
│  (FastAPI/Express)  │  Loads index & answers questions
└─────────────────────┘
```

---

## 📊 Mathematical Explanation

### 1. **Text Chunking**
```
PDF Page (4000 words) → Split into chunks
├─ Chunk 1: "Accounts Payable allows..." (512 tokens)
├─ Chunk 2: "To create a vendor invoice..." (512 tokens)
├─ Chunk 3: "Purchase orders integrate..." (512 tokens)
└─ Chunk 4: "Payment processing requires..." (512 tokens)
```

### 2. **Embedding Generation (The Magic)**

Each text chunk is converted into a 1024-dimensional vector:

```python
Text: "Accounts Payable allows you to track vendor invoices"
         ↓ (BGE-M3 Neural Network)
Vector: [0.234, -0.451, 0.892, 0.103, ..., 0.127]
         └────────── 1024 numbers ───────────┘
```

**What do these numbers mean?**
- Each dimension captures a semantic feature
- Similar texts produce similar vectors
- Example dimensions might represent:
  - Position 42: "financial concepts" (0.89 = strong)
  - Position 156: "action verbs" (0.23 = weak)
  - Position 789: "accounting processes" (0.67 = moderate)

### 3. **Vector Similarity Search**

When you query "How do I create a purchase order?":

```python
# Step 1: Embed the query
Query Vector = BGE-M3("How do I create a purchase order?")
             = [0.189, -0.523, 0.911, 0.098, ..., 0.082]

# Step 2: Calculate similarity with ALL stored vectors
Cosine Similarity = (Query · Document) / (||Query|| × ||Document||)

# Example calculations:
Document 1 (about invoices):     similarity = 0.42  ❌
Document 2 (about purchase orders): similarity = 0.94  ✅ TOP MATCH
Document 3 (about payments):     similarity = 0.61  ❌
Document 4 (about vendors):      similarity = 0.38  ❌

# Step 3: Retrieve top 5 most similar chunks
Top Results = [Doc 2, Doc 3, Doc 7, Doc 12, Doc 19]

# Step 4: Send to Llama 3.1 with context
Llama 3.1 generates answer using retrieved chunks as context
```

### 4. **Cosine Similarity Formula**

```
           A · B
cos(θ) = ─────────
         ||A|| ||B||

Where:
A = Query vector [a₁, a₂, ..., a₁₀₂₄]
B = Document vector [b₁, b₂, ..., b₁₀₂₄]

A · B = a₁b₁ + a₂b₂ + ... + a₁₀₂₄b₁₀₂₄  (dot product)
||A|| = √(a₁² + a₂² + ... + a₁₀₂₄²)    (magnitude)
||B|| = √(b₁² + b₂² + ... + b₁₀₂₄²)    (magnitude)

Result: -1 to 1 (1 = identical, 0 = unrelated, -1 = opposite)
```

---

## 🗄️ Database Schema

After ingestion, PostgreSQL contains:

```sql
TABLE: sage_docs

┌──────────┬──────────┬─────────────────────┬──────────────────┐
│ id       │ text     │ embedding           │ metadata         │
├──────────┼──────────┼─────────────────────┼──────────────────┤
│ uuid-1   │ "Acc..." │ [0.23, -0.45, ...]  │ {"source": ...}  │
│ uuid-2   │ "To c..."│ [0.19, -0.52, ...]  │ {"source": ...}  │
│ uuid-3   │ "Purch"  │ [0.31, -0.48, ...]  │ {"source": ...}  │
└──────────┴──────────┴─────────────────────┴──────────────────┘

Types:
- id: UUID (unique identifier)
- text: TEXT (original chunk)
- embedding: VECTOR(1024) (pgvector type)
- metadata: JSONB (source file, page number, etc.)

Indexes:
- HNSW index on embedding column for fast similarity search
- O(log n) search complexity vs O(n) for brute force
```

---

## 🚀 How to Run

### Prerequisites

1. **Ollama must be running on your host machine:**
   ```powershell
   # Check if running
   Get-Process ollama
   
   # If not running, start it
   ollama serve
   
   # Verify models are installed
   ollama list
   # Should show:
   # - llama3.1:latest
   # - bge-m3:latest
   ```

2. **Docker containers must be running:**
   ```powershell
   docker-compose up -d db
   ```

### Run Ingestion (First Time)

```powershell
# Run the ingestion container
docker-compose --profile ingest up ingestion

# What happens:
# 1. Container starts
# 2. Connects to PostgreSQL
# 3. Reads PDFs from sage_documentation/
# 4. Generates embeddings (takes 5-10 minutes)
# 5. Stores in database
# 6. Container exits
```

### Re-running Ingestion (To Update)

**⚠️ IMPORTANT:** The script prevents duplicates by default!

If you try to run ingestion again, you'll see:
```
⚠ Found 150 existing documents in sage_docs table
⚠ Re-running ingestion will create DUPLICATES!
⚠ Skipping ingestion to prevent duplicates.
```

**To force re-ingestion:**

1. Add to `.env`:
   ```
   FORCE_REINGEST=true
   ```

2. Run:
   ```powershell
   docker-compose --profile ingest up ingestion
   ```

3. This will:
   - Drop the old `sage_docs` table
   - Re-create it from scratch
   - Re-process all PDFs

---

## 📋 Environment Variables

Required in `.env` or `docker-compose.yml`:

```bash
# Ollama Configuration
OLLAMA_API_BASE=http://host.docker.internal:11434

# PostgreSQL Configuration
POSTGRES_DB=tuttle_docs
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Optional: Force re-ingestion
FORCE_REINGEST=false  # Set to 'true' to clear and re-ingest
```

---

## 🔍 Verification

After ingestion completes, verify the data:

```powershell
# Connect to PostgreSQL
docker exec -it tuttle_customer_mapping-db-1 psql -U user -d tuttle_docs

# Check table exists
\dt

# Count documents
SELECT COUNT(*) FROM sage_docs;

# View a sample
SELECT id, LEFT(text, 100), metadata FROM sage_docs LIMIT 5;

# Check embedding dimensions
SELECT id, array_length(embedding, 1) as dimensions FROM sage_docs LIMIT 1;
# Should return: 1024

# Exit
\q
```

---

## 📊 Expected Output

```
╔═══════════════════════════════════════════════════════╗
║  Sage Documentation Ingestion System                ║
║  Powered by LlamaIndex + Ollama + pgvector          ║
╚═══════════════════════════════════════════════════════╝

Configuration loaded:
  - Ollama API: http://host.docker.internal:11434
  - Database: db:5432/tuttle_docs

✓ Database connection successful
✓ pgvector extension enabled
✓ Vector store initialized
📖 Reading documents from /app/sage_documentation

✓ Successfully read 150 document pages

⏳ Starting embedding generation... this may take several minutes
   Each document will be:
   1. Split into chunks (~512-1024 tokens each)
   2. Converted to 1024-dimensional vectors by BGE-M3
   3. Stored in PostgreSQL with pgvector

[Progress bar shows]

╔═══════════════════════════════════════════════════════╗
║  ✓ INGESTION COMPLETE!                               ║
╚═══════════════════════════════════════════════════════╝

✓ 150 documents embedded and stored

DATABASE TABLE STRUCTURE:
─────────────────────────────────────────
Table: sage_docs
  • id (UUID): Unique identifier
  • text (TEXT): Original text chunk
  • embedding (VECTOR(1024)): 1024-dim vector
  • metadata (JSONB): Source file, page, etc.

NEXT STEPS TO QUERY THIS DATA:
─────────────────────────────────────────
1. Create a Python query API (FastAPI recommended)
2. Load this index: VectorStoreIndex.from_vector_store()
3. Create query engine: index.as_query_engine()
4. Call from Node.js backend via REST API
```

---

## 🛠️ Troubleshooting

### Error: "Connection refused to Ollama"
```
✗ Database connection error: could not connect to server
```

**Solution:**
1. Ensure Ollama is running: `ollama serve`
2. Check it's accessible: `curl http://localhost:11434/api/tags`
3. Verify `OLLAMA_API_BASE` in `.env` is correct

### Error: "Model not found"
```
✗ Model bge-m3 not found
```

**Solution:**
```powershell
ollama pull bge-m3
ollama pull llama3.1
```

### Error: "pgvector extension not found"
```
✗ extension "vector" does not exist
```

**Solution:**
- The container should have pgvector pre-installed
- If not, you're not using `pgvector/pgvector:pg16` image
- Update `docker-compose.yml` to use correct image

### Ingestion is very slow
```
⏳ Been running for 30+ minutes...
```

**This is normal!**
- Each chunk needs to be embedded by BGE-M3
- For 150 pages × 4 chunks/page = 600 embeddings
- Each embedding takes ~1-2 seconds
- Total: 10-20 minutes expected

**To speed up:**
- Reduce chunk size in LlamaIndex settings
- Use a smaller embedding model
- Use GPU acceleration (if available)

---

## 📈 Performance Characteristics

### Storage Requirements
```
Per document page (average):
- Raw text: ~2 KB
- Embedding: 1024 floats × 4 bytes = 4 KB
- Metadata: ~1 KB
- Total per page: ~7 KB

For 150 pages:
- Total storage: ~1 MB (very efficient!)
```

### Query Performance
```
With HNSW index:
- 1,000 documents: ~5-10ms per query
- 10,000 documents: ~10-20ms per query
- 100,000 documents: ~20-50ms per query

Without index (brute force):
- 1,000 documents: ~100ms
- 10,000 documents: ~1 second
- 100,000 documents: ~10 seconds
```

---

## 🔄 Next Steps: Creating the Query API

You mentioned you'll handle the Node.js backend yourself. Here's what you need to know:

### Option 1: Python Query API (Recommended)

Create `query_api.py` that loads the index and exposes a REST endpoint:

```python
from llama_index.core import VectorStoreIndex
from llama_index.vector_stores.postgres import PGVectorStore

# Load existing vectors
vector_store = PGVectorStore.from_params(...)
index = VectorStoreIndex.from_vector_store(vector_store)
query_engine = index.as_query_engine()

# Query
response = query_engine.query("How do I create a purchase order?")
```

### Option 2: Direct PostgreSQL Access from Node.js

Query the `sage_docs` table directly:

```typescript
// 1. Embed the user's question using Ollama
const queryEmbedding = await embedText(userQuestion);

// 2. Find similar vectors using pgvector
const result = await pool.query(`
  SELECT text, embedding <=> $1::vector AS distance
  FROM sage_docs
  ORDER BY distance
  LIMIT 5
`, [queryEmbedding]);

// 3. Send top results + question to Llama 3.1
const context = result.rows.map(r => r.text).join('\n\n');
const answer = await queryLlama(userQuestion, context);
```

### Which should you choose?

**Python API**: Easier, uses LlamaIndex's built-in features
**Direct Node.js**: More control, no extra service needed

I recommend starting with the Python API for simplicity!

---

## 📚 Additional Resources

- [LlamaIndex Documentation](https://docs.llamaindex.ai/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Ollama API Reference](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [BGE-M3 Model Info](https://huggingface.co/BAAI/bge-m3)

---

**Questions?** Check the logs:
```powershell
docker logs tuttle_customer_mapping-ingestion-1
```

Or view the in-container log:
```powershell
docker exec tuttle_customer_mapping-ingestion-1 cat /app/ingestion.log
```
