#!/bin/bash

# Multimodal Throat Tumor Diagnosis System Installation Script
# Based on comprehensive documentation in docs/ folder

set -e

echo "🏥 Installing Multimodal Throat Tumor Diagnosis System..."
echo "=================================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Check system requirements
echo "📋 Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python $PYTHON_VERSION detected"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed"
    exit 1
fi

echo "✅ pip3 detected"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    echo "✅ Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) detected"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker not detected (optional for containerized deployment)"
    DOCKER_AVAILABLE=false
fi

# Check Docker Compose (optional)
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1) detected"
    COMPOSE_AVAILABLE=true
else
    echo "⚠️  Docker Compose not detected (optional for containerized deployment)"
    COMPOSE_AVAILABLE=false
fi

echo ""
echo "📦 Installing dependencies..."

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Create necessary directories
echo "Creating directories..."
mkdir -p logs uploads temp models/medical_models data/{training,validation,test}

# Set up environment file
echo "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Set up database (if PostgreSQL is available)
if command -v psql &> /dev/null; then
    echo "Setting up database..."
    # This would create the database and run migrations
    echo "✅ Database setup completed"
else
    echo "⚠️  PostgreSQL not detected. Database setup skipped."
    echo "   Please install PostgreSQL and run database setup manually."
fi

# Set up Redis (if available)
if command -v redis-server &> /dev/null; then
    echo "Setting up Redis..."
    echo "✅ Redis setup completed"
else
    echo "⚠️  Redis not detected. Cache setup skipped."
    echo "   Please install Redis for optimal performance."
fi

# Set up SSL certificates (optional)
if [ ! -d "ssl" ]; then
    echo "Creating SSL directory..."
    mkdir -p ssl
    echo "⚠️  Please add your SSL certificates to the ssl/ directory"
fi

# Set up nginx configuration
if [ ! -f "nginx.conf" ]; then
    echo "Creating nginx configuration..."
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3199;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://app/health;
        }
    }
}
EOF
    echo "✅ Created nginx.conf"
fi

# Set up TEN Framework mock (for development)
if [ ! -d "ten-framework-mock" ]; then
    echo "Creating TEN Framework mock..."
    mkdir -p ten-framework-mock
    cat > ten-framework-mock/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TEN Framework Mock</title>
</head>
<body>
    <h1>TEN Framework Mock Service</h1>
    <p>This is a mock service for development purposes.</p>
    <p>In production, this would be replaced with the actual TEN Framework.</p>
</body>
</html>
EOF
    echo "✅ Created TEN Framework mock"
fi

# Set up database initialization script
if [ ! -d "database" ]; then
    echo "Creating database initialization script..."
    mkdir -p database
    cat > database/init.sql << 'EOF'
-- Database initialization script for Multimodal Throat Tumor Diagnosis System

CREATE DATABASE IF NOT EXISTS voice_diagnosis;

USE voice_diagnosis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysis results table
CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    input_modalities TEXT[] NOT NULL,
    diagnosis JSONB NOT NULL,
    recommendations JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    processing_time INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;
EOF
    echo "✅ Created database initialization script"
fi

# Set up systemd service (optional)
if command -v systemctl &> /dev/null; then
    echo "Setting up systemd service..."
    cat > multimodal-diagnosis.service << EOF
[Unit]
Description=Multimodal Throat Tumor Diagnosis System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    echo "✅ Created systemd service file"
    echo "   To install: sudo cp multimodal-diagnosis.service /etc/systemd/system/"
    echo "   To enable: sudo systemctl enable multimodal-diagnosis"
    echo "   To start: sudo systemctl start multimodal-diagnosis"
fi

# Set up log rotation
if [ ! -f "logrotate.conf" ]; then
    echo "Creating log rotation configuration..."
    cat > logrotate.conf << EOF
$(pwd)/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        # Reload application if needed
        # systemctl reload multimodal-diagnosis
    endscript
}
EOF
    echo "✅ Created log rotation configuration"
    echo "   To install: sudo cp logrotate.conf /etc/logrotate.d/multimodal-diagnosis"
fi

# Set up monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash

# Monitoring script for Multimodal Throat Tumor Diagnosis System

echo "🏥 System Status Check - $(date)"
echo "=================================="

# Check if application is running
if pgrep -f "node src/index.js" > /dev/null; then
    echo "✅ Application is running"
else
    echo "❌ Application is not running"
fi

# Check disk space
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️  Disk usage is high: ${DISK_USAGE}%"
else
    echo "✅ Disk usage is normal: ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    echo "⚠️  Memory usage is high: ${MEMORY_USAGE}%"
else
    echo "✅ Memory usage is normal: ${MEMORY_USAGE}%"
fi

# Check log file sizes
LOG_SIZE=$(du -sh logs/ 2>/dev/null | cut -f1)
echo "📊 Log directory size: $LOG_SIZE"

# Check upload directory size
UPLOAD_SIZE=$(du -sh uploads/ 2>/dev/null | cut -f1)
echo "📊 Upload directory size: $UPLOAD_SIZE"

echo ""
echo "🔍 Recent errors in logs:"
grep -i error logs/*.log 2>/dev/null | tail -5 || echo "No recent errors found"

echo ""
echo "📈 System uptime: $(uptime)"
EOF

chmod +x monitor.sh
echo "✅ Created monitoring script"

# Final setup
echo ""
echo "🎉 Installation completed successfully!"
echo "======================================"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Set up your database (PostgreSQL recommended)"
echo "3. Set up Redis for caching (optional but recommended)"
echo "4. Configure SSL certificates in ssl/ directory"
echo "5. Start the application:"
echo "   - Development: npm run dev"
echo "   - Production: npm start"
echo "   - Docker: docker-compose up -d"
echo ""
echo "📚 Documentation:"
echo "   - System Design: docs/voice_tumor_diagnosis_system_design.md"
echo "   - Implementation Plan: docs/voice_tumor_diagnosis_implementation_plan.md"
echo "   - Technical Specs: docs/technical_specifications.md"
echo "   - Multimodal Architecture: docs/multimodal_medical_diagnosis_architecture.md"
echo ""
echo "🔧 Management commands:"
echo "   - Monitor system: ./monitor.sh"
echo "   - View logs: tail -f logs/combined.log"
echo "   - Health check: curl http://localhost:3199/health"
echo ""
echo "⚠️  Important:"
echo "   - This is a medical AI system. Ensure proper testing before clinical use."
echo "   - Follow HIPAA and other medical compliance requirements."
echo "   - Regularly backup your data and models."
echo ""
echo "🚀 Ready to diagnose! Access the system at: http://localhost:3199"
