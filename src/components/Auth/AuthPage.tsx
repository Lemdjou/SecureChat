import { useState } from 'react';
import { Lock } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJoMnYtMmgtMnYtMmgtMnYyem0wLTJoLTJ2Mmgydi0yem0yIDBoMnYtMmgtMnYyem0wIDJ2Mmgydi0yaC0yem0yIDBoMnYtMmgtMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

      <div className="w-full max-w-md relative">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Lock className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">SecureChat</h1>
            <p className="text-blue-100 text-center text-sm">
              Messagerie chiffrée de bout en bout avec RSA
            </p>
          </div>

          <div className="p-8">
            <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all duration-200 ${
                  isLogin
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all duration-200 ${
                  !isLogin
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Créer un compte
              </button>
            </div>

            {isLogin ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>

        <p className="text-center text-white/60 text-sm mt-6">
          Vos messages sont protégés par chiffrement RSA 2048 bits
        </p>
      </div>
    </div>
  );
}
