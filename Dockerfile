FROM python:3.11-slim

# Set environment
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8080

WORKDIR /app

# Copy dependency definition
COPY backend/requirements_gcr.txt /app/requirements.txt

# Install dependencies cleanly
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy worker application
COPY backend/cloud_sync_worker.py /app/cloud_sync_worker.py
COPY backend/gcr_app.py /app/gcr_app.py

EXPOSE 8080

# Launch server
CMD ["python", "gcr_app.py"]
