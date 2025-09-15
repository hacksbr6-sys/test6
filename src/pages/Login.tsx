import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, User, Lock, Settings } from 'lucide-react';
import { login, setCurrentUser } from '../lib/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(credentials);
    
    if (result.success && result.user) {
      setCurrentUser(result.user);
      navigate('/');
    } else {
      setError(result.error || 'Erro ao fazer login');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-black/50 rounded-xl p-8 border border-red-600">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-red-600 p-3 rounded-lg">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MECÂNICA GUAIANASES</h1>
                <p className="text-red-400 text-sm">GuaianaseRP</p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Fazer Login</h2>
            <p className="text-gray-400">Entre com suas credenciais</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Email / Usuário
              </label>
              <input
                type="text"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                placeholder="seu@email.com ou nome de usuário"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Senha
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                placeholder="Digite sua senha"
                required
              />
            </div>

            {error && (
              <div className="bg-red-600/10 border border-red-600 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Register Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-400 text-sm">Não tem uma conta?</p>
            <div className="flex flex-col space-y-2">
              <Link
                to="/register/client"
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Registrar como Cliente
              </Link>
              <Link
                to="/register/mechanic"
                className="text-green-400 hover:text-green-300 text-sm transition-colors"
              >
                Registrar como Mecânico
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;