FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files
COPY . .

# Expose port 8000
EXPOSE 8000

# Run FastAPI app with uvicorn
CMD ["uvicorn", "main:api", "--host", "0.0.0.0", "--port", "8000"]
