FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY ingest.py ./ingest.py

# Expose port if needed
EXPOSE 8000

# Run the ingestion script
CMD ["python", "ingest.py"]
