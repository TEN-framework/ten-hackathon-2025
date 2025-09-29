# Multimodal Throat Tumor Diagnosis System
# Based on comprehensive documentation in docs/ folder

FROM node:24-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    python3-dev \
    libffi-dev \
    libssl-dev \
    postgresql-client \
    redis-tools \
    ffmpeg \
    imagemagick \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm install --omit=dev

# Install Python dependencies
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories (from install.sh logic)
RUN mkdir -p logs uploads temp models/medical_models data/{training,validation,test} ssl

# Set up environment file from template
RUN cp env.example .env

# Set up nginx configuration (from install.sh)
RUN echo 'events { worker_connections 1024; } http { upstream app { server app:3199; } server { listen 80; server_name localhost; location / { proxy_pass http://app; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; } location /health { proxy_pass http://app/health; } } }' > nginx.conf

# Set up TEN Framework mock (from install.sh)
RUN mkdir -p ten-framework-mock && \
    echo '<!DOCTYPE html><html><head><title>TEN Framework Mock</title></head><body><h1>TEN Framework Mock Service</h1><p>This is a mock service for development purposes.</p><p>In production, this would be replaced with the actual TEN Framework.</p></body></html>' > ten-framework-mock/index.html

# Set up database initialization script (from install.sh)
RUN mkdir -p database

# Set up monitoring script (from install.sh)
RUN echo '#!/bin/bash\n\n# Monitoring script for Multimodal Throat Tumor Diagnosis System\n\necho "🏥 System Status Check - $(date)"\necho "=================================="\n\n# Check if application is running\nif pgrep -f "node src/index.js" > /dev/null; then\n    echo "✅ Application is running"\nelse\n    echo "❌ Application is not running"\nfi\n\n# Check disk space\nDISK_USAGE=$(df -h . | awk '\''NR==2 {print $5}'\'' | sed '\''s/%//'\'')\nif [ "$DISK_USAGE" -gt 80 ]; then\n    echo "⚠️  Disk usage is high: ${DISK_USAGE}%"\nelse\n    echo "✅ Disk usage is normal: ${DISK_USAGE}%"\nfi\n\n# Check memory usage\nMEMORY_USAGE=$(free | awk '\''NR==2{printf "%.0f", $3*100/$2}'\'')\nif [ "$MEMORY_USAGE" -gt 80 ]; then\n    echo "⚠️  Memory usage is high: ${MEMORY_USAGE}%"\nelse\n    echo "✅ Memory usage is normal: ${MEMORY_USAGE}%"\nfi\n\n# Check log file sizes\nLOG_SIZE=$(du -sh logs/ 2>/dev/null | cut -f1)\necho "📊 Log directory size: $LOG_SIZE"\n\n# Check upload directory size\nUPLOAD_SIZE=$(du -sh uploads/ 2>/dev/null | cut -f1)\necho "📊 Upload directory size: $UPLOAD_SIZE"\n\necho ""\necho "🔍 Recent errors in logs:"\ngrep -i error logs/*.log 2>/dev/null | tail -5 || echo "No recent errors found"\n\necho ""\necho "📈 System uptime: $(uptime)"' > monitor.sh && \
    chmod +x monitor.sh

# Set up log rotation configuration (from install.sh)
RUN echo '$(pwd)/logs/*.log {\n    daily\n    missingok\n    rotate 30\n    compress\n    delaycompress\n    notifempty\n    create 644 root root\n    postrotate\n        # Reload application if needed\n        # systemctl reload multimodal-diagnosis\n    endscript\n}' > logrotate.conf

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3199
ENV DATABASE_URL=postgresql://username:password@postgres:5432/voice_diagnosis
ENV REDIS_URL=redis://redis:6379

# Expose port
EXPOSE 3199

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3199/health || exit 1

# Start application
CMD ["npm", "start"]
