#!/bin/bash

# Script to create SSL certificates for MySQL
# This script generates a Certificate Authority (CA) and server certificates
# for secure MySQL connections in Docker Compose (server-side SSL only)

set -e  # Exit on any error

# Certificate configuration
CERT_DIR="$(dirname "$0")"
DAYS_VALID=365
KEY_SIZE=2048
COUNTRY="US"
STATE="CA"
CITY="San Francisco"
ORG="Mojaloop"
OU="Database"
SERVER_CN="mysql"

echo "Creating SSL certificates for MySQL..."
echo "Certificate directory: $CERT_DIR"

# Clean up existing certificates
echo "Cleaning up existing certificates..."
rm -f "$CERT_DIR"/*.pem "$CERT_DIR"/*.key "$CERT_DIR"/*.crt "$CERT_DIR"/*.csr

# Create CA private key
echo "Creating CA private key..."
openssl genrsa -out "$CERT_DIR/ca-key.pem" $KEY_SIZE

# Create CA certificate
echo "Creating CA certificate..."
openssl req -new -x509 -nodes -days $DAYS_VALID \
    -key "$CERT_DIR/ca-key.pem" \
    -out "$CERT_DIR/ca.pem" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$OU/CN=MySQL_CA"

# Create server private key
echo "Creating server private key..."
openssl genrsa -out "$CERT_DIR/server-key.pem" $KEY_SIZE

# Create server certificate signing request
echo "Creating server certificate signing request..."
openssl req -new \
    -key "$CERT_DIR/server-key.pem" \
    -out "$CERT_DIR/server.csr" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$OU/CN=$SERVER_CN"

# Create server certificate signed by CA
echo "Creating server certificate..."
openssl x509 -req -days $DAYS_VALID \
    -in "$CERT_DIR/server.csr" \
    -CA "$CERT_DIR/ca.pem" \
    -CAkey "$CERT_DIR/ca-key.pem" \
    -CAcreateserial \
    -out "$CERT_DIR/server-cert.pem" \
    -extensions v3_req \
    -extfile <(cat <<EOF
[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $SERVER_CN
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF
)

# Set proper permissions
echo "Setting file permissions..."
chmod 600 "$CERT_DIR"/*-key.pem
chmod 644 "$CERT_DIR"/*.pem

# Clean up temporary files
echo "Cleaning up temporary files..."
rm -f "$CERT_DIR"/*.csr "$CERT_DIR"/*.srl

echo ""
echo "SSL certificates created successfully!"
echo ""
echo "Generated files:"
echo "  - ca.pem (Certificate Authority)"
echo "  - ca-key.pem (CA private key)"
echo "  - server-cert.pem (Server certificate)"
echo "  - server-key.pem (Server private key)"
echo ""
echo "To verify the certificates:"
echo "  openssl x509 -in $CERT_DIR/ca.pem -text -noout"
echo "  openssl x509 -in $CERT_DIR/server-cert.pem -text -noout"
echo ""
echo "To test SSL connection:"
echo "  mysql -h 127.0.0.1 -P 3306 -u example_user -p --ssl-ca=$CERT_DIR/ca.pem"
echo "  mysql -h 127.0.0.1 -P 3306 -u example_user -p --ssl-mode=VERIFY_IDENTITY --ssl-ca=$CERT_DIR/ca.pem"
echo "  mysql -h 127.0.0.1 -P 3306 -u example_user -p --ssl-mode=VERIFY_CA --ssl-ca=$CERT_DIR/ca.pem"