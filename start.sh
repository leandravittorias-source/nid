#!/bin/bash

# NósDois Startup Script
# Builds and starts the server

echo "🏡 NósDois - Iniciando sistema..."
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
  echo "📦 Compilando projeto..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "❌ Erro na compilação"
    exit 1
  fi
fi

# Check if server.cjs exists
if [ ! -f "dist/server.cjs" ]; then
  echo "❌ Arquivo servidor não encontrado. Execute: npm run build"
  exit 1
fi

echo "✅ Projeto pronto"
echo ""
echo "🚀 Iniciando servidor..."
echo "📍 Acesse em: http://localhost:3000"
echo ""

# Start the server
NODE_ENV=production PORT=3000 node dist/server.cjs
