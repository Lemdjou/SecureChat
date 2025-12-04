import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Inbox from './Inbox';
import Compose from './Compose';
import KeyManagement from './KeyManagement';
import { LogOut, Inbox as InboxIcon, Send, Key } from 'lucide-react';

type View = 'inbox' | 'compose' | 'keys';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('inbox');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SecureChat</h1>
                <p className="text-xs text-gray-500">Messagerie chiffrée</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-500">@{profile?.username}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setCurrentView('inbox')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                  currentView === 'inbox'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <InboxIcon className="w-5 h-5" />
                Boîte de réception
              </button>
              <button
                onClick={() => setCurrentView('compose')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                  currentView === 'compose'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Send className="w-5 h-5" />
                Nouveau message
              </button>
              <button
                onClick={() => setCurrentView('keys')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                  currentView === 'keys'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Key className="w-5 h-5" />
                Gestion des clés
              </button>
            </div>
          </div>

          <div className="p-6">
            {currentView === 'inbox' && <Inbox />}
            {currentView === 'compose' && <Compose />}
            {currentView === 'keys' && <KeyManagement />}
          </div>
        </div>
      </div>
    </div>
  );
}
