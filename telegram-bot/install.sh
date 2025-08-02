#!/bin/bash

echo "📦 Installation des dépendances du bot..."

# Installer les dépendances principales
npm install

# Essayer d'installer mongoose (optionnel)
echo "🔧 Tentative d'installation de MongoDB (optionnel)..."
npm install mongoose --no-save --silent || echo "⚠️  MongoDB non installé - Le bot utilisera les fichiers JSON"

echo "✅ Installation terminée!"