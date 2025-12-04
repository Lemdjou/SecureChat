import { useState, useEffect } from 'react';
import { supabase, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { encryptMessage } from '../../lib/crypto';
import { Send, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function Compose() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id)
      .order('username');

    if (data) {
      setUsers(data);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!selectedUser) {
      setError('Veuillez sélectionner un destinataire');
      return;
    }

    if (!message.trim()) {
      setError('Veuillez entrer un message');
      return;
    }

    setLoading(true);

    try {
      const { data: keyData } = await supabase
        .from('key_pairs')
        .select('public_key')
        .eq('user_id', selectedUser)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!keyData) {
        throw new Error('Le destinataire n\'a pas de clé publique active');
      }

      const encryptedContent = await encryptMessage(keyData.public_key, message);

      const { error: insertError } = await supabase.from('messages').insert({
        sender_id: user?.id,
        recipient_id: selectedUser,
        encrypted_content: encryptedContent,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setMessage('');
      setSelectedUser('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800 font-medium">
            Message chiffré et envoyé avec succès!
          </p>
        </div>
      )}

      <div>
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
          Destinataire
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select
            id="recipient"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
            required
          >
            <option value="">Sélectionnez un utilisateur...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} (@{u.username})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écrivez votre message ici..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          rows={8}
          required
        />
        <p className="text-sm text-gray-500 mt-2">
          Votre message sera chiffré avec la clé publique RSA du destinataire
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Send className="w-5 h-5" />
        {loading ? 'Envoi en cours...' : 'Envoyer le message chiffré'}
      </button>
    </form>
  );
}
