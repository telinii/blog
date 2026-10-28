#!/bin/sh
# Migrations antes de aceitar tráfego: num container novo o banco está vazio.
# `migrate deploy` só aplica migrations pendentes (não gera nem reseta nada).
set -e

echo "Aplicando migrations..."
npx prisma migrate deploy

echo "Subindo a API na porta ${PORT:-3000}..."
exec node dist/index.js
