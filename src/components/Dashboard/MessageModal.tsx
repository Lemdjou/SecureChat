import { useState, useEffect } from 'react';
import { supabase, Message } from '../../lib/supabase';
import { decryptMessage } from '../../lib/crypto';
import { usePrivateKey } from '../../contexts/PrivateKeyContext';
import { X, Lock, AlertCircle, Key, RefreshCw } from 'lucide-react';

type MessageWithSender = Message & {
  sender: {
    username: string;
    full_name: string;
  };
};

type Props = {
  message: MessageWithSender;
  onClose: () => void;
  onKeyError: () => void;
};

export default function MessageModal({ message, onClose, onKeyError }: Props) {
  const { privateKey, isLoading: isKeyLoading, fetchPrivateKey } = usePrivateKey();
  const [decryptedContent, setDecryptedContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const decrypt = async () => {
      if (!privateKey) {
        setError('Clé privée non disponible. Assurez-vous qu\'elle est chargée.');
        setLoading(false);
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
      } catch {
        setError('Impossible de déchiffrer le message. Votre clé est peut-être incorrecte ou corrompue.');
        onKeyError();
      } finally {
        setLoading(false);
      }
    };

    if (!isKeyLoading) {
      decrypt();
    }
  }, [privateKey, message, isKeyLoading, onKeyError]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderContent = () => {
    if (loading || isKeyLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Déchiffrement en cours...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-800">Erreur de déchiffrement</h3>
          <p className="text-gray-600">{error}</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left flex items-start gap-3">
             <Key className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
             <div>
              <p className="text-sm text-red-900 font-medium mb-1">
                Problème de clé privée
              </p>
              <p className="text-sm text-red-800">
                Nous n'avons pas pu déchiffrer ce message avec la clé privée enregistrée. Elle est peut-être corrompue ou ne correspond pas à la clé publique utilisée pour chiffrer ce message.
              </p>
             </div>
          </div>
           <button
            onClick={() => fetchPrivateKey()}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer de charger la clé
          </button>
        </div>
      );
    }

    if (decryptedContent) {
      return (
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
      );
    }

    return null;
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
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
