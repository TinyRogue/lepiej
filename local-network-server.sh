#!/bin/bash

# Get local IP address on macOS
IP=$(ipconfig getifaddr en0)

# Fallback if en0 doesn't exist (e.g. Ethernet)
if [ -z "$IP" ]; then
  IP=$(ipconfig getifaddr en1)
fi

if [ -z "$IP" ]; then
  echo "Could not determine local IP address."
  exit 1
fi

echo "📱 Access your Hugo site on your phone:"
echo "👉 http://$IP:1313"
echo ""

# Run Hugo development server
hugo server -D --bind 0.0.0.0 --baseURL http://$IP:1313 --disableFastRender