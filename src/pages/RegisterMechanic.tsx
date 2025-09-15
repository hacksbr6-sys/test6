import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, User, Mail, Phone, Lock, Settings, Clock } from 'lucide-react';
import { registerMechanic } from '../lib/auth';

const RegisterMechanic: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    // Dados enviados para registro de mecânico
    const result = await registerMechanic({
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    });
    
    if (result.success) {
      setSuccess(result.message || 'Registro enviado com sucesso!');
      // Limpar formulário após sucesso
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
    } else {
      setError(result.error || 'Erro ao registrar mecânico');
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
        <div className="bg-black/50 rounded-xl p-8 border border-green-600">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-green-600 p-3 rounded-lg">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MECÂNICA GUAIANASES</h1>
                <p className="text-green-400 text-sm">GuaianaseRP</p>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Registro de Mecânico</h2>
            <p className="text-gray-400">Solicite acesso como mecânico</p>
            
            <div className="bg-yellow-600/10 border border-yellow-600 rounded-lg p-3 mt-4">
              <div className="flex items-center justify-center space-x-2 text-yellow-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Aprovação Necessária</span>
              </div>
              <p className="text-yellow-300 text-xs mt-1">
                Seu registro será analisado pelo administrador antes da liberação
              </p>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-600 focus:outline-none"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-600 focus:outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                <Phone className="h-4 w-4 inline mr-2" />
                Telefone (Opcional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-600 focus:outline-none"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Senha
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-600 focus:outline-none"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                <Lock className="h-4 w-4 inline mr-2" />
                Confirmar Senha
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-green-600 focus:outline-none"
                placeholder="Digite a senha novamente"
                required
              />
            </div>

            {error && (
              <div className="bg-red-600/10 border border-red-600 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-600/10 border border-green-600 rounded-lg p-4 text-green-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Solicitar Registro
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Já tem uma conta?</p>
            <Link
              to="/login"
              className="text-green-400 hover:text-green-300 text-sm transition-colors"
            >
              Fazer Login
            </Link>
          </div>

          <div className="mt-4 text-center">
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

export default RegisterMechanic;