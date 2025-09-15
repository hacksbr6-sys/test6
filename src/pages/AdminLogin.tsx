import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';
import { adminLogin, setAdminLogin } from '../lib/supabase';
import { login, setCurrentUser } from '../lib/auth';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Try admin login first
    let result = await adminLogin(credentials.username, credentials.password);
    
    if (result.success) {
      setAdminLogin(true, result.role, result.username);
      navigate('/admin');
    } else {
      // Try main auth system as fallback
      try {
        const mainAuthResult = await login({ 
          email: credentials.username, 
          password: credentials.password 
        });
        
        if (mainAuthResult.success && mainAuthResult.user?.type === 'admin') {
          setCurrentUser(mainAuthResult.user);
          navigate('/admin');
        } else {
          setError('Credenciais inválidas ou usuário não é administrador');
        }
      } catch (error) {
        setError('Erro ao fazer login');
      }
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
            <div className="bg-red-600 p-4 rounded-full w-16 h-16 mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Área do Administrador</h1>
            <p className="text-gray-400">Entre com suas credenciais para acessar o painel</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Usuário
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                placeholder="Digite seu usuário"
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
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-colors"
            >
              {isLoading ? 'Entrando...' : 'Entrar no Painel'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Voltar ao site
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;