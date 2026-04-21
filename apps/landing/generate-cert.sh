#!/bin/bash

# Create .cert directory if it doesn't exist
mkdir -p .cert

# Generate SSL certificate for localhost
openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
  -keyout .cert/localhost-key.pem \
  -out .cert/localhost-cert.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "✓ SSL certificates generated in .cert/"
echo "✓ You can now run: npm run start:https"
