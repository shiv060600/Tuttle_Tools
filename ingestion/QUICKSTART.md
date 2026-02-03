
# 🚀 Quick Start Guide

## TL;DR - Run Ingestion Now

```powershell
# 1. Make sure Ollama is running
ollama serve

# 2. Start PostgreSQL
docker-compose up -d db

# 3. Wait for DB to be ready (about 10 seconds)
Start-Sleep -Seconds 10

# 4. Run ingestion
docker-compose --profile ingest up ingestion

# 5. Watch the magic happen! ✨
```

---

## What's Happening?

### Phase 1: Initialization (5 seconds)
```
✓ Database connection successful
✓ pgvector extension enabled
✓ Vector store initialized
📖 Reading documents from /app/sage_documentation
```

### Phase 2: Document Loading (10 seconds)
```
✓ Successfully read 150 document pages
```

### Phase 3: Embedding Generation (5-15 minutes)
```
⏳ Starting embedding generation...
   1. Split into chunks (~512-1024 tokens each)
   2. Converted to 1024-dimensional vectors by BGE-M3
   3. Stored in PostgreSQL with pgvector

[████████████████████████████████████] 100%
```

### Phase 4: Completion
```
╔═══════════════════════════════════════════════════════╗
║  ✓ INGESTION COMPLETE!                               ║
╚═══════════════════════════════════════════════════════╝

✓ 150 documents embedded and stored
```

---

## Verify It Worked

```powershell
# Connect to database
docker exec -it tuttle_customer_mapping-db-1 psql -U user -d tuttle_docs

# Count documents
SELECT COUNT(*) FROM sage_docs;
# Expected: 150+ rows

# View sample
SELECT LEFT(text, 100) FROM sage_docs LIMIT 3;

# Exit
\q
```

---

## Common Issues

### ❌ "Connection refused to Ollama"
```powershell
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

### ❌ "Database already contains data"
This is **intentional** to prevent duplicates!

To re-ingest, add to `.env`:
```
FORCE_REINGEST=true
```

Then run again:
```powershell
docker-compose --profile ingest up ingestion
```

### ❌ "Model not found: bge-m3"
```powershell
ollama pull bge-m3
ollama pull llama3.1
```

---

## Next Steps

After ingestion completes:

1. **For Node.js Integration**: Read `NODEJS_INTEGRATION.md`
2. **For System Details**: Read `README.md`
3. **Create Query API**: Follow the integration guide

---

## One-Liner Setup

```powershell
ollama serve; Start-Sleep 2; docker-compose up -d db; Start-Sleep 10; docker-compose --profile ingest up ingestion
```

---

**Time Estimate**: 10-20 minutes total
**Storage Used**: ~1-2 MB in PostgreSQL
**Models Required**: llama3.1 (4.9 GB), bge-m3 (1.2 GB)

**Ready?** Run the commands above! 🚀
