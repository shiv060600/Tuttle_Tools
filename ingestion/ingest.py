import os
import psycopg2
from llama_index.core import (StorageContext, VectorStoreIndex, SimpleDirectoryReader, Settings)
from llama_index.vector_stores.postgres import PGVectorStore
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Load environment variables
OLLAMA_API_BASE = os.getenv("OLLAMA_API_BASE", "http://host.docker.internal:11434")
DB_NAME = os.getenv("DB_NAME", "tuttle_docs")
DB_USER = os.getenv("DB_USER", "user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")

logger.info(f"Configuration loaded:")
logger.info(f"  - Ollama API: {OLLAMA_API_BASE}")
logger.info(f"  - Database: {DB_HOST}:{DB_PORT}/{DB_NAME}")

# Configure LlamaIndex Settings
# BGE-M3 is a multilingual embedding model that creates 1024-dimensional vectors
# Each dimension captures semantic meaning of the text
Settings.embed_model = OllamaEmbedding(
    model_name="bge-m3",
    base_url=OLLAMA_API_BASE
)

# Llama 3.1 is used for understanding and generating responses (not used during ingestion)
Settings.llm = Ollama(
    model="llama3.1",
    base_url=OLLAMA_API_BASE
)

def setup_database() -> bool:
    """
    Ensure the vector database is accessible and the pgvector extension is enabled.
    
    This function:
    1. Tests the PostgreSQL connection
    2. Ensures pgvector extension is installed (required for vector operations)
    3. Validates that we can connect to the database
    
    Returns:
        bool: True if database is ready, False otherwise
    """
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        cursor = conn.cursor()

        # Enable pgvector extension if not already enabled
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.commit()

        logger.info("✓ Database connection successful")
        logger.info("✓ pgvector extension enabled")
        
        cursor.close()
        conn.close()
        return True

    except psycopg2.DatabaseError as psye:
        logger.error(f"✗ Database connection error: {psye}")
        return False

    except Exception as e:
        logger.error(f"✗ General error occurred: {e}")
        return False


def check_existing_data() -> int:
    """
    Check if data already exists in the sage_docs table.
    
    Returns:
        int: Number of existing documents, or 0 if table doesn't exist
    """
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        cursor = conn.cursor()
        
        # Check if table exists and count rows
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_name = 'sage_docs'
        """)
        table_exists = cursor.fetchone()[0] > 0
        
        if table_exists:
            cursor.execute("SELECT COUNT(*) FROM sage_docs")
            count = cursor.fetchone()[0]
            cursor.close()
            conn.close()
            return count
        else:
            cursor.close()
            conn.close()
            return 0
            
    except Exception as e:
        logger.warning(f"Could not check existing data: {e}")
        return 0


def clear_existing_data():
    """
    Clear all existing data from the sage_docs table.
    This prevents duplicate embeddings when re-running ingestion.
    """
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        cursor = conn.cursor()
        
        # Drop the table if it exists (PGVectorStore will recreate it)
        cursor.execute("DROP TABLE IF EXISTS sage_docs CASCADE")
        conn.commit()
        
        logger.info("✓ Cleared existing sage_docs table")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"✗ Error clearing existing data: {e}")
        raise


def run_ingestion():
    """
    Main ingestion function that processes PDFs and creates vector embeddings.
    
    This function:
    1. Reads PDF files from the sage_documentation directory
    2. Splits them into chunks (typically 512-1024 tokens each)
    3. Generates 1024-dimensional embeddings for each chunk using BGE-M3
    4. Stores embeddings in PostgreSQL with pgvector for fast similarity search
    
    HOW IT WORKS (Mathematical Explanation):
    ─────────────────────────────────────────────────────────────────
    
    1. DOCUMENT CHUNKING:
       PDF Text → Split into overlapping chunks
       Example: "Accounts Payable allows you to track vendor invoices..."
       
    2. EMBEDDING GENERATION (BGE-M3 Model):
       Text Chunk → Neural Network → 1024 numbers (vector)
       
       Example:
       "Accounts Payable tracks invoices" → [0.23, -0.45, 0.89, ..., 0.12]
                                              └──────── 1024 values ────────┘
       
       Each number represents a semantic feature:
       - Position 42 might encode "financial concepts"
       - Position 156 might encode "action verbs"
       - Position 789 might encode "business processes"
       
    3. VECTOR STORAGE (PostgreSQL + pgvector):
       Stored as: {text, embedding, metadata}
       
       pgvector creates an index for fast similarity search using:
       - HNSW (Hierarchical Navigable Small World) algorithm
       - IVFFlat (Inverted File with Flat compression)
       
    4. LATER: SIMILARITY SEARCH (When querying):
       Query: "How do I create a purchase order?"
       → Embed query → [0.19, -0.52, 0.91, ..., 0.08]
       → Find closest vectors using cosine similarity
       
       Cosine Similarity Formula:
       similarity = (A · B) / (||A|| × ||B||)
       
       Where:
       A = query vector
       B = stored document vector
       
       Result: Top 5 most relevant text chunks
    """
    
    # Check for existing data
    existing_count = check_existing_data()
    
    force_reingest = os.getenv("FORCE_REINGEST", "false").lower() == "true"
    
    if existing_count > 0:
        if force_reingest:
            logger.info(f"⚠ Found {existing_count} existing documents. Force re-ingesting...")
            clear_existing_data()
        else:
            logger.warning(f"")
            logger.warning(f"╔═══════════════════════════════════════════════════════╗")
            logger.warning(f"║  ⚠ WARNING: DATA ALREADY EXISTS!                     ║")
            logger.warning(f"╚═══════════════════════════════════════════════════════╝")
            logger.warning(f"")
            logger.warning(f"Found {existing_count} existing documents in sage_docs table")
            logger.warning(f"Re-running ingestion will create DUPLICATES!")
            logger.warning(f"")
            logger.warning(f"To re-ingest:")
            logger.warning(f"  1. Set FORCE_REINGEST=true in .env")
            logger.warning(f"  2. Run: docker-compose --profile ingest up ingestion")
            logger.warning(f"")
            logger.warning(f"Skipping ingestion to prevent duplicates.")
            return

    # Initialize PGVectorStore connection
    # This creates the table structure if it doesn't exist
    vector_store = PGVectorStore.from_params(
        database=DB_NAME,
        host=DB_HOST,
        password=DB_PASSWORD,
        user=DB_USER,
        port=DB_PORT,
        table_name="sage_docs",
        embed_dim=1024,  # BGE-M3 produces 1024-dimensional vectors
        hybrid_search=True  # Enables both keyword and vector similarity search
    )

    logger.info("✓ Vector store initialized")
    logger.info("📖 Reading documents from /app/sage_documentation")

    # Read all PDF files from the directory
    reader = SimpleDirectoryReader(
        input_dir="/app/sage_documentation",
        recursive=True
    )

    documents = reader.load_data()

    logger.info(f"✓ Successfully read {len(documents)} document pages")
    logger.info(f"")
    logger.info(f"⏳ Starting embedding generation... this may take several minutes")
    logger.info(f"   Each document will be:")
    logger.info(f"   1. Split into chunks (~512-1024 tokens each)")
    logger.info(f"   2. Converted to 1024-dimensional vectors by BGE-M3")
    logger.info(f"   3. Stored in PostgreSQL with pgvector")
    logger.info(f"")

    # Create storage context with our vector store
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    # This is where the magic happens:
    # - Documents are chunked
    # - Each chunk is sent to Ollama's BGE-M3 model
    # - BGE-M3 returns a 1024-dimensional vector
    # - Vectors are stored in PostgreSQL with pgvector
    index = VectorStoreIndex.from_documents(
        documents,
        storage_context=storage_context,
        show_progress=True,
    )

    logger.info("")
    logger.info("╔═══════════════════════════════════════════════════════╗")
    logger.info("║  ✓ INGESTION COMPLETE!                               ║")
    logger.info("╚═══════════════════════════════════════════════════════╝")
    logger.info(f"")
    logger.info(f"✓ {len(documents)} documents embedded and stored")
    logger.info(f"")
    logger.info(f"DATABASE TABLE STRUCTURE:")
    logger.info(f"─────────────────────────────────────────")
    logger.info(f"Table: sage_docs")
    logger.info(f"  • id (UUID): Unique identifier")
    logger.info(f"  • text (TEXT): Original text chunk")
    logger.info(f"  • embedding (VECTOR(1024)): 1024-dim vector")
    logger.info(f"  • metadata (JSONB): Source file, page, etc.")
    logger.info(f"")
    logger.info(f"NEXT STEPS TO QUERY THIS DATA:")
    logger.info(f"─────────────────────────────────────────")
    logger.info(f"1. Create a Python query API (FastAPI recommended)")
    logger.info(f"2. Load this index: VectorStoreIndex.from_vector_store()")
    logger.info(f"3. Create query engine: index.as_query_engine()")
    logger.info(f"4. Call from Node.js backend via REST API")


if __name__ == "__main__":
    """
    Main execution block - runs when container starts
    """
    # Setup logging first - write to container's local directory, not mounted volume
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("/app/ingestion.log"),  # Write to container's writable directory
            logging.StreamHandler()  # Also log to console for Docker logs
        ]
    )

    logger.info("")
    logger.info("╔═══════════════════════════════════════════════════════╗")
    logger.info("║  Sage Documentation Ingestion System                ║")
    logger.info("║  Powered by LlamaIndex + Ollama + pgvector          ║")
    logger.info("╚═══════════════════════════════════════════════════════╝")
    logger.info("")

    # Check database connectivity
    if not setup_database():
        logger.error("✗ Failed to setup database, exiting")
        exit(1)

    # Run the ingestion process
    try:
        run_ingestion()
        logger.info("")
        logger.info("✓ Ingestion process completed successfully")
        logger.info("✓ You can now query the sage_docs table from your Node.js backend")
    except Exception as e:
        logger.error("")
        logger.error(f"✗ Ingestion failed: {e}")
        logger.error(f"✗ Check logs for details")
        import traceback
        logger.error(traceback.format_exc())
        exit(1)


