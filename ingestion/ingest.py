import os
import dotenv
from marshmallow.fields import Bool
import psycopg2
from llama_index.core import (StorageContext,VectorStoreIndex,SimpleDirectoryReader,Settings)
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
import logging

logger = logging.getLogger(__name__)

OLLAMA_API_BASE = "http://host.docker.internal:11434"
DB_NAME = "tuttle_docs"
DB_USER = "user"
DB_PASSWORD = "password"
DB_HOST = "db"
DB_PORT = "5432"

Settings.embed_model = OllamaEmbedding(
    model_name = "bge-m3",
    base_url=OLLAMA_API_BASE
)

Settings.llm = Ollama(
    model = "llama3.1",
    base_url = OLLAMA_API_BASE
)

def setup_database() -> bool:
    """Ensure the vector database table exists for pgvector"""
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )

        logger.info("Database connection successful")
        return True

    except psycopg2.DatabaseError as psye:
        logger.error(f"Database connection error: {psye}")
        return False

    except Exception as e:
        logger.error(f"General error occurred: {e}")
        return False

    finally:
        if 'conn' in locals():
            conn.close()

def run_ingestion():

    vector_store = PGVectorStore.from_params(
        database=DB_NAME,
        host=DB_HOST,
        password=DB_PASSWORD,
        user=DB_USER,
        port=DB_PORT,
        table_name="sage_docs",
        embed_dim=1024,  
        hybrid_search=True # Allows keyword + vector search
    )

    logger.info("reading documents from /app/sage_documentation")

    reader = SimpleDirectoryReader(
        input_dir = "/app/sage_documentation",
        recursive = True
    )

    documents = reader.load_data()

    logger.info(f"successfully read {len(documents)} different documetation pages")
    logger.info(f"starting storage context... may take a while ...")

    storage_context = StorageContext.from_defaults(vector_store = vector_store)

    index = VectorStoreIndex.from_documents(
        documents,
        storage_context = storage_context,
        show_progress = True,
    )

    logger.info("ingestion complete")


if __name__ == "__main__":
    # Setup logging first - write to container's local directory, not mounted volume
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("/app/ingestion.log"),  # Write to container's writable directory
            logging.StreamHandler()  # Also log to console for Docker logs
        ]
    )

    logger.info("Starting Sage documentation ingestion process")

    # Check database connectivity
    if not setup_database():
        logger.error("Failed to setup database, exiting")
        exit(1)

    # Run the ingestion process
    try:
        run_ingestion()
        logger.info("Ingestion process completed successfully")
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        exit(1)


