# Use official Python 3.11 slim image
FROM python:3.11-slim

# Install system dependencies (FFmpeg + ImageMagick + standard font packages)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Fix ImageMagick security policy to allow text/font processing
# (Required by MoviePy to prevent policy blocks on TextClips)
RUN sed -i 's/domain="coder" rights="none" pattern="PDF"/domain="coder" rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml || true
RUN sed -i 's/domain="path" rights="none" pattern="@\*"/domain="path" rights="read|write" pattern="@*"/' /etc/ImageMagick-6/policy.xml || true

# Set up working directory
WORKDIR /workspace

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app files and config
COPY app ./app
COPY .env ./

# Create data directories for persistence
RUN mkdir -p data/uploads data/outputs

# Expose FastAPI port
EXPOSE 8000

# Start Uvicorn production server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
