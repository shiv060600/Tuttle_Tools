from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from llama_index.core import VectorStoreIndex, Settings
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
from models.models import QueryRequest, QueryResponse
from fastapi import Depends
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_API_BASE", "http://host.docker.internal:11434")


Settings.embed_model = OllamaEmbedding(
    model_name="bge-m3",
    base_url=os.getenv("OLLAMA_API_BASE", "http://host.docker.internal:11434")
)

Settings.llm = Ollama(
    model="llama3.1",
    base_url=os.getenv("OLLAMA_API_BASE", "http://host.docker.internal:11434")
)

vector_store = PGVectorStore.from_params(
    database = os.getenv("DB_NAME", "tuttle_docs"),
    host = os.getenv("DB_HOST", "localhost"),
    port = str(os.getenv("DB_PORT", 5432)),
    password = os.getenv("DB_PASSWORD"),
    user = os.getenv("DB_USER"),
    table_name = os.getenv("DB_TABLE", "sage_docs"),
    embed_dim = 1024,
    hybrid_search = True
)





query_api = FastAPI(title = "API to query the internal sage model")
@query_api.get("/health")
async def health_check():
    return {"status": "ok"}

@query_api.post("/query")
async def query_endpoint(request = Depends(QueryRequest)) -> QueryResponse:
    try:
        index = VectorStoreIndex.load_from_vector_store(vector_store)
        query_engine = index.as_query_engine()
        response = query_engine.query(request.query)
        return QueryResponse(result=str(response))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(query_api, host="0.0.0.0", port=6969)