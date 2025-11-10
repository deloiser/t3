#!/bin/bash

# Get the workspace directory (parent of .devcontainer)
WORKSPACE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$WORKSPACE_DIR" || {
  echo "❌ Failed to change to workspace directory"
  exit 1
}

echo "🚀 Starting wp2astro development environment with PM2..."
echo "📁 Working directory: $WORKSPACE_DIR"

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Check if ws module is available
if [ ! -d "node_modules/ws" ]; then
  echo "⚠️  WebSocket dependency missing, installing..."
  npm install ws chokidar
fi

# Verify PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "❌ PM2 not found, installing..."
  npm install -g pm2
fi

# Stop any existing PM2 processes
echo "🧹 Cleaning up any existing processes..."
pm2 delete all 2>/dev/null || true
sleep 2

# Start services with PM2
echo "📡 Starting services with PM2..."
if ! pm2 start .devcontainer/ecosystem.config.js; then
  echo "❌ Failed to start PM2 services, retrying..."
  sleep 2
  pm2 start .devcontainer/ecosystem.config.js || {
    echo "❌ Failed to start PM2 services after retry"
    echo "Checking PM2 logs..."
    pm2 logs --lines 20 --nostream || true
    echo "Attempting to start services manually..."
    # Try starting services individually as fallback
    pm2 start "$WORKSPACE_DIR/.devcontainer/ws-server.js" --name websocket --cwd "$WORKSPACE_DIR" || true
    pm2 start npm --name astro --cwd "$WORKSPACE_DIR" -- run dev || true
  }
fi

# Save PM2 process list to survive restarts
pm2 save --force || true

# Configure PM2 startup script (may fail in Codespaces, that's OK)
pm2 startup systemd -u $(whoami) --hp $HOME 2>/dev/null || pm2 startup -u $(whoami) --hp $HOME 2>/dev/null || true

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Show PM2 status immediately
echo ""
echo "📊 PM2 Status:"
pm2 list

# Check if services are actually running
if ! pm2 list | grep -q "online"; then
  echo "⚠️  Warning: No PM2 services are online"
  echo "Checking logs for errors..."
  pm2 logs --lines 50 --nostream || true
fi

# Wait for Astro server to be ready
echo "⏳ Waiting for Astro server to be ready..."
ASTRO_READY=false
for i in {1..60}; do
  if curl -s http://localhost:4321 > /dev/null 2>&1; then
    echo "✅ Astro server is ready!"
    ASTRO_READY=true
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo "⏳ Still waiting for Astro server... (checking PM2 status)"
    pm2 list
    pm2 logs astro --lines 10 --nostream || true
  fi
done

if [ "$ASTRO_READY" = false ]; then
  echo "⚠️  Astro server did not become ready within 60 seconds"
  echo "Checking PM2 logs..."
  pm2 logs astro --lines 20 --nostream || true
fi

# Check WebSocket server is responding
echo "🔍 Checking WebSocket server..."
WS_READY=false
for i in {1..10}; do
  if lsof -i:8080 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":8080"; then
    echo "✅ WebSocket server is listening on port 8080"
    WS_READY=true
    break
  fi
  sleep 1
done

if [ "$WS_READY" = false ]; then
  echo "⚠️  WebSocket server did not start on port 8080"
  echo "Checking PM2 logs..."
  pm2 logs websocket --lines 20 --nostream || true
fi

# Set ports to public (for GitHub Codespaces)
if command -v gh &> /dev/null && [ -n "$CODESPACE_NAME" ]; then
  echo "🔓 Setting ports to public..."
  # Wait a bit for ports to be forwarded
  sleep 5
  
  # Set ports to public synchronously with retries
  for port in 4321 8080; do
    for attempt in {1..5}; do
      if gh codespace ports visibility "$port:public" -c "$CODESPACE_NAME" 2>/dev/null; then
        echo "✅ Port $port set to public"
        break
      else
        if [ $attempt -lt 5 ]; then
          echo "⏳ Retrying to set port $port to public (attempt $attempt/5)..."
          sleep 2
        else
          echo "⚠️  Failed to set port $port to public after 5 attempts"
        fi
      fi
    done
  done
elif [ -n "$CODESPACE_NAME" ]; then
  echo "⚠️  GitHub CLI not available, ports may need to be set to public manually"
  echo "   Go to the Ports tab and set ports 4321 and 8080 to public"
fi

# Open index.astro in the editor
code src/pages/index.astro 2>/dev/null || true

# Wait a moment for the file to open
sleep 2

# Open preview in Simple Browser (split view)
code --open-url "http://localhost:4321" 2>/dev/null || true

echo ""
echo "🎉 Workspace ready!"
echo "📝 Edit on the left, preview on the right"
echo "🔗 WebSocket: localhost:8080"
echo "🌐 Preview: localhost:4321"
echo ""
echo "Services are managed by PM2 (production-grade process manager)"
echo ""
echo "PM2 Commands:"
echo "  Status:  pm2 list"
echo "  Logs:    pm2 logs"
echo "  Restart: pm2 restart all"
echo "  Stop:    pm2 stop all"
echo ""
echo "Individual logs:"
echo "  WebSocket: pm2 logs websocket"
echo "  Astro: pm2 logs astro"
