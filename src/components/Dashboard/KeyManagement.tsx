import { useState, useEffect } from 'react';
import { supabase, KeyPair } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { generateRSAKeyPair, formatPrivateKey } from '../../lib/crypto';
import { Key, AlertCircle, RefreshCw, Copy, CheckCircle, Calendar, Clock } from 'lucide-react';

export default function KeyManagement() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<KeyPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [newPrivateKey, setNewPrivateKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadKeys();
  }, [user]);

  const loadKeys = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('key_pairs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setKeys(data);
    }
    setLoading(false);
  };

  const handleRegenerateKey = async () => {
    if (!user) return;

    const confirmRegen = window.confirm(
      'Attention: La régénération de votre clé rendra les anciens messages indéchiffrables avec la nouvelle clé. Voulez-vous continuer?'
    );

    if (!confirmRegen) return;

    setRegenerating(true);

    try {
      await supabase
        .from('key_pairs')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      const keyPair = await generateRSAKeyPair();

      const { error } = await supabase.from('key_pairs').insert({
        user_id: user.id,
        public_key: keyPair.publicKey,
        private_key_encrypted: keyPair.privateKey,
        is_active: true,
      });

      if (error) throw error;

      setNewPrivateKey(keyPair.privateKey);
      await loadKeys();
    } catch (err) {
      alert('Erreur lors de la régénération de la clé');
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiration = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const activeKey = keys.find((k) => k.is_active);
  const daysLeft = activeKey ? getDaysUntilExpiration(activeKey.expires_at) : 0;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Chargement...</p>
      </div>
    );
  }

  if (newPrivateKey) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-900 font-medium mb-1">
                Nouvelle clé générée avec succès
              </p>
              <p className="text-sm text-green-800">
                Votre nouvelle clé RSA a été créée. Copiez votre clé privée et conservez-la en lieu sûr.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Votre nouvelle clé privée RSA
          </label>
          <div className="bg-gray-900 rounded-lg p-4 relative">
            <pre className="text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {formatPrivateKey(newPrivateKey)}
            </pre>
            <button
              onClick={() => copyToClipboard(newPrivateKey)}
              className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-md transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={() => setNewPrivateKey('')}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          J'ai copié ma clé, continuer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium mb-1">
              Gestion des clés de chiffrement
            </p>
            <p className="text-sm text-blue-800">
              Vos clés RSA sont utilisées pour chiffrer et déchiffrer vos messages. Pour des raisons de sécurité, elles expirent après 90 jours.
            </p>
          </div>
        </div>
      </div>

      {activeKey && (
        <div className={`rounded-lg p-6 border-2 ${
          daysLeft <= 7
            ? 'bg-red-50 border-red-300'
            : daysLeft <= 30
            ? 'bg-amber-50 border-amber-300'
            : 'bg-green-50 border-green-300'
        }`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className={`font-semibold text-lg mb-2 ${
                daysLeft <= 7
                  ? 'text-red-900'
                  : daysLeft <= 30
                  ? 'text-amber-900'
                  : 'text-green-900'
              }`}>
                Clé active
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>Créée le {formatDate(activeKey.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>Expire le {formatDate(activeKey.expires_at)}</span>
                </div>
              </div>
            </div>
            <div className={`text-right ${
              daysLeft <= 7
                ? 'text-red-900'
                : daysLeft <= 30
                ? 'text-amber-900'
                : 'text-green-900'
            }`}>
              <div className="text-3xl font-bold">{daysLeft}</div>
              <div className="text-sm">jours restants</div>
            </div>
          </div>

          {daysLeft <= 30 && (
            <div className={`mt-4 p-3 rounded-lg ${
              daysLeft <= 7 ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <p className={`text-sm font-medium ${
                daysLeft <= 7 ? 'text-red-900' : 'text-amber-900'
              }`}>
                {daysLeft <= 7
                  ? 'Attention: Votre clé expire bientôt! Pensez à la renouveler.'
                  : 'Votre clé expire bientôt. Vous pouvez la renouveler dès maintenant.'}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-3">
          Renouveler la clé
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Générez une nouvelle paire de clés RSA. Vos anciens messages resteront accessibles avec votre ancienne clé privée.
        </p>
        <button
          onClick={handleRegenerateKey}
          disabled={regenerating}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Génération en cours...' : 'Générer une nouvelle clé'}
        </button>
      </div>

      {keys.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">
            Historique des clés
          </h3>
          <div className="space-y-3">
            {keys.filter((k) => !k.is_active).map((key) => (
              <div
                key={key.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>Créée le {formatDate(key.created_at)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Expirée le {formatDate(key.expires_at)}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                    Inactive
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {keys.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune clé trouvée</h3>
          <p className="text-gray-500">Générez votre première clé RSA</p>
        </div>
      )}
    </div>
  );
}
