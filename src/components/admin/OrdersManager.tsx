'use client';
import { useState, useEffect } from 'react';
import contentCache from '../../lib/contentCache';

export default function OrdersManager() {
  const [telegramLink, setTelegramLink] = useState('');
  const [editingLink, setEditingLink] = useState(false);
  const [newTelegramLink, setNewTelegramLink] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        const link = data.telegramOrderLink || data.telegramLink || '';
        setTelegramLink(link);
        setNewTelegramLink(link);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const saveTelegramLink = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramOrderLink: newTelegramLink })
      });

      if (response.ok) {
        setTelegramLink(newTelegramLink);
        setEditingLink(false);
        
        // Rafraîchir le cache pour maintenir le background
        await contentCache.refresh();
        
        alert('Lien Telegram mis à jour avec succès !');
      }
    } catch (error) {
      console.error('Erreur sauvegarde lien:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Commandes</h1>
      </div>

      {/* Configuration du lien Telegram */}
      <div className="bg-gray-800 rounded-lg p-6 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">Lien Telegram pour commander</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lien Telegram
            </label>
            
            {editingLink ? (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newTelegramLink}
                  onChange={(e) => setNewTelegramLink(e.target.value)}
                  placeholder="https://t.me/votre_bot"
                  className="flex-1 bg-gray-700 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={saveTelegramLink}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setEditingLink(false);
                    setNewTelegramLink(telegramLink);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-gray-700 border border-white/20 text-white rounded-lg px-4 py-2">
                  {telegramLink || 'Aucun lien configuré'}
                </div>
                <button
                  onClick={() => setEditingLink(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Modifier
                </button>
              </div>
            )}
            
            <p className="text-sm text-gray-400 mt-2">
              Ce lien sera utilisé dans les boutons "Commander via Telegram"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}