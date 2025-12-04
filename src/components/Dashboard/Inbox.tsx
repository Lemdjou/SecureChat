import { useState, useEffect } from 'react';
import { supabase, Message } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import MessageModal from './MessageModal';
import { Mail, MailOpen, Clock } from 'lucide-react';

type MessageWithSender = Message & {
  sender: {
    username: string;
    full_name: string;
  };
};

export default function Inbox() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithSender | null>(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel('inbox-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user?.id}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username, full_name)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMessages(data as MessageWithSender[]);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Chargement des messages...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun message</h3>
        <p className="text-gray-500">Votre boîte de réception est vide</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {messages.map((message) => (
          <button
            key={message.id}
            onClick={() => setSelectedMessage(message)}
            className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
              message.read_at
                ? 'bg-white border-gray-200'
                : 'bg-blue-50 border-blue-200 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-1">
                  {message.read_at ? (
                    <MailOpen className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Mail className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-medium truncate ${
                      message.read_at ? 'text-gray-900' : 'text-blue-900'
                    }`}>
                      {message.sender.full_name}
                    </p>
                    <span className="text-gray-400 text-sm">@{message.sender.username}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    Message chiffré - Cliquez pour déchiffrer
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                <Clock className="w-4 h-4" />
                {formatDate(message.created_at)}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedMessage && (
        <MessageModal
          message={selectedMessage}
          onClose={() => {
            setSelectedMessage(null);
            loadMessages();
          }}
        />
      )}
    </>
  );
}
