# Node.js Backend Integration Guide

## Overview

This guide shows you how to integrate the RAG system with your Node.js/Express backend.

---

## Option 1: Python FastAPI Query Service (Recommended)

### Step 1: Create `ingestion/query_api.py`

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Sage Documentation Query API")

# Configure LlamaIndex
Settings.embed_model = OllamaEmbedding(
    model_name="bge-m3",
    base_url=os.getenv("OLLAMA_API_BASE", "http://host.docker.internal:11434")
)

Settings.llm = Ollama(
    model="llama3.1",
    base_url=os.getenv("OLLAMA_API_BASE", "http://host.docker.internal:11434")
)

# Load the existing vector store
vector_store = PGVectorStore.from_params(
    database=os.getenv("POSTGRES_DB", "tuttle_docs"),
    host=os.getenv("POSTGRES_HOST", "db"),
    password=os.getenv("POSTGRES_PASSWORD", "password"),
    user=os.getenv("POSTGRES_USER", "user"),
    port=os.getenv("POSTGRES_PORT", "5432"),
    table_name="sage_docs",
    embed_dim=1024
)

# Create query engine
index = VectorStoreIndex.from_vector_store(vector_store)
query_engine = index.as_query_engine(
    similarity_top_k=5,  # Return top 5 most relevant chunks
    response_mode="compact"  # Compact response format
)

class QueryRequest(BaseModel):
    question: str
    max_tokens: int = 500

class QueryResponse(BaseModel):
    answer: str
    sources: list[str]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "sage-rag-api"}

@app.post("/query", response_model=QueryResponse)
async def query_documentation(request: QueryRequest):
    """
    Query the Sage 300 documentation using RAG.
    
    Example:
    POST /query
    {
        "question": "How do I create a purchase order in Sage 300?",
        "max_tokens": 500
    }
    """
    try:
        # Query the index
        response = query_engine.query(request.question)
        
        # Extract sources from metadata
        sources = []
        if hasattr(response, 'source_nodes'):
            sources = [
                node.node.metadata.get('file_name', 'Unknown')
                for node in response.source_nodes
            ]
        
        return QueryResponse(
            answer=str(response),
            sources=list(set(sources))  # Deduplicate sources
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Step 2: Create `ingestion/Dockerfile.query`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install fastapi uvicorn

# Copy query API
COPY query_api.py ./query_api.py

EXPOSE 8000

# Run the query API
CMD ["uvicorn", "query_api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 3: Update `docker-compose.yml`

Add this service:

```yaml
  # RAG Query API
  rag-api:
    build:
      context: ./ingestion
      dockerfile: Dockerfile.query
    ports:
      - "8000:8000"
    environment:
      - POSTGRES_DB=tuttle_docs
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
      - OLLAMA_API_BASE=http://host.docker.internal:11434
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Step 4: Create Node.js Route (`server/routes/sage.ts`)

```typescript
import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const RAG_API_URL = process.env.RAG_API_URL || 'http://rag-api:8000';

interface QueryRequest {
  question: string;
  max_tokens?: number;
}

interface QueryResponse {
  answer: string;
  sources: string[];
}

/**
 * POST /api/sage/query
 * 
 * Query the Sage 300 documentation using RAG
 * 
 * Body:
 * {
 *   "question": "How do I create a purchase order?",
 *   "max_tokens": 500
 * }
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { question, max_tokens = 500 }: QueryRequest = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Question is required' 
      });
    }

    // Call the Python RAG API
    const response = await axios.post<QueryResponse>(
      `${RAG_API_URL}/query`,
      { question, max_tokens },
      { timeout: 30000 } // 30 second timeout
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('RAG query error:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'Failed to query documentation',
        details: error.response?.data || error.message
      });
    }

    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/sage/health
 * 
 * Check if RAG API is available
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${RAG_API_URL}/health`, {
      timeout: 5000
    });
    
    res.json({
      status: 'healthy',
      rag_api: response.data
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'RAG API not available'
    });
  }
});

export default router;
```

### Step 5: Register Route in `server/index.ts`

```typescript
import sageRoutes from './routes/sage';

// ... other imports

// Register routes
app.use('/api/sage', sageRoutes);
```

### Step 6: Start Everything

```powershell
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f rag-api
```

### Step 7: Test from Frontend

```typescript
// In your React component
const querySageDocumentation = async (question: string) => {
  try {
    const response = await fetch('/api/sage/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Answer:', data.data.answer);
      console.log('Sources:', data.data.sources);
      return data.data;
    }
  } catch (error) {
    console.error('Query failed:', error);
  }
};

// Usage
querySageDocumentation("How do I create a purchase order in Sage 300?");
```

---

## Option 2: Direct Node.js Integration (Advanced)

If you want to query directly from Node.js without a Python API:

### Step 1: Install Dependencies

```powershell
npm install @xenova/transformers pg-vector
```

### Step 2: Create Embedding Service

```typescript
// server/services/embeddings.ts
import axios from 'axios';

const OLLAMA_API = process.env.OLLAMA_API_BASE || 'http://host.docker.internal:11434';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await axios.post(`${OLLAMA_API}/api/embeddings`, {
    model: 'bge-m3',
    prompt: text
  });
  
  return response.data.embedding;
}
```

### Step 3: Create Query Service

```typescript
// server/services/rag.ts
import { Pool } from 'pg';
import axios from 'axios';
import { generateEmbedding } from './embeddings';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  database: process.env.POSTGRES_DB || 'tuttle_docs',
  user: process.env.POSTGRES_USER || 'user',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: Number(process.env.POSTGRES_PORT) || 5432
});

const OLLAMA_API = process.env.OLLAMA_API_BASE || 'http://host.docker.internal:11434';

export async function querySageDocumentation(question: string): Promise<string> {
  // Step 1: Generate embedding for the question
  const queryEmbedding = await generateEmbedding(question);
  
  // Step 2: Find similar documents using pgvector
  const result = await pool.query(`
    SELECT text, metadata, embedding <=> $1::vector AS distance
    FROM sage_docs
    ORDER BY distance
    LIMIT 5
  `, [JSON.stringify(queryEmbedding)]);
  
  // Step 3: Build context from top results
  const context = result.rows
    .map(row => row.text)
    .join('\n\n');
  
  // Step 4: Generate answer using Llama 3.1
  const prompt = `Context from Sage 300 documentation:
${context}

Question: ${question}

Please provide a detailed answer based on the documentation above.`;

  const llmResponse = await axios.post(`${OLLAMA_API}/api/generate`, {
    model: 'llama3.1',
    prompt: prompt,
    stream: false
  });
  
  return llmResponse.data.response;
}
```

### Step 4: Create Route

```typescript
// server/routes/sage.ts
import express from 'express';
import { querySageDocumentation } from '../services/rag';

const router = express.Router();

router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;
    const answer = await querySageDocumentation(question);
    
    res.json({ success: true, answer });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Query failed' });
  }
});

export default router;
```

---

## Testing

### Test RAG API directly:

```powershell
# Health check
curl http://localhost:8000/health

# Query
curl -X POST http://localhost:8000/query `
  -H "Content-Type: application/json" `
  -d '{"question": "How do I create a purchase order?"}'
```

### Test through Node.js backend:

```powershell
# Health check
curl http://localhost:3001/api/sage/health

# Query
curl -X POST http://localhost:3001/api/sage/query `
  -H "Content-Type: application/json" `
  -d '{"question": "How do I create a purchase order in Sage 300?"}'
```

---

## Performance Tips

1. **Caching**: Cache frequent queries
2. **Rate Limiting**: Prevent abuse of expensive LLM calls
3. **Streaming**: For long responses, use streaming
4. **Connection Pooling**: Reuse database connections
5. **Async Processing**: Queue long-running queries

---

## Security Considerations

1. **Authentication**: Require auth for query endpoint
2. **Rate Limiting**: Limit queries per user/IP
3. **Input Validation**: Sanitize user questions
4. **Logging**: Log all queries for monitoring
5. **Timeouts**: Set appropriate timeouts

---

## Monitoring

```typescript
// Add middleware to log queries
router.post('/query', logQueryMiddleware, async (req, res) => {
  // ... query logic
});

function logQueryMiddleware(req, res, next) {
  console.log({
    timestamp: new Date(),
    user: req.user?.id,
    question: req.body.question,
    ip: req.ip
  });
  next();
}
```

---

## Troubleshooting

### "Connection refused" to RAG API

Check if service is running:
```powershell
docker ps | findstr rag-api
docker logs tuttle_customer_mapping-rag-api-1
```

### Slow query responses

- Check Ollama is using GPU (if available)
- Reduce `similarity_top_k` from 5 to 3
- Use streaming for better UX

### "Model not found" error

Ensure models are pulled:
```powershell
ollama pull bge-m3
ollama pull llama3.1
```

---

**Recommendation**: Start with Option 1 (Python FastAPI) as it's simpler and leverages LlamaIndex's built-in features!
