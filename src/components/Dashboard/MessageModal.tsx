import { useState } from 'react';
import { supabase, Message } from '../../lib/supabase';
import { decryptMessage } from '../../lib/crypto';
import { X, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

type MessageWithSender = Message & {
  sender: {
    username: string;
    full_name: string;
  };
};

type Props = {
  message: MessageWithSender;
  onClose: () => void;
};

export default function MessageModal({ message, onClose }: Props) {
  const [privateKey, setPrivateKey] = useState('');
  const [decryptedContent, setDecryptedContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleDecrypt = async () => {
    if (!privateKey.trim()) {
      setError('Veuillez entrer votre clé privée');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const decrypted = await decryptMessage(privateKey, message.encrypted_content);
      setDecryptedContent(decrypted);

      if (!message.read_at) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', message.id);
      }
    } catch (err) {
      setError('Impossible de déchiffrer le message. Vérifiez votre clé privée.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Message chiffré</h2>
              <p className="text-blue-100 text-sm">
                De: {message.sender.full_name} (@{message.sender.username})
              </p>
              <p className="text-blue-100 text-sm">
                {formatDate(message.created_at)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!decryptedContent ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-900 font-medium mb-1">
                    Message protégé par chiffrement RSA
                  </p>
                  <p className="text-sm text-amber-800">
                    Entrez votre clé privée pour déchiffrer et lire ce message.
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clé privée RSA
                </label>
                <div className="relative">
                  <textarea
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Collez votre clé privée ici..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm resize-none"
                    rows={6}
                    style={{ WebkitTextSecurity: showKey ? 'none' : 'disc' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-3 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleDecrypt}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Déchiffrement...' : 'Déchiffrer le message'}
              </button>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 font-medium">
                  Message déchiffré avec succès
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {decryptedContent}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
