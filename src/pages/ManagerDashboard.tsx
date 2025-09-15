import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Car, 
  Plus, 
  Bell, 
  Save, 
  X, 
  Eye, 
  Check,
  AlertCircle,
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';
import { useNotifications, useCars } from '../hooks/useSupabase';

interface CarForm {
  brand: string;
  model: string;
  year: number;
  price: number;
  description: string;
  image_url: string;
}

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { notifications, unreadCount, refetch: refetchNotifications } = useNotifications();
  const { cars, refetch: refetchCars } = useCars();
  
  const [activeTab, setActiveTab] = useState<'cars' | 'notifications'>('cars');
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carForm, setCarForm] = useState<CarForm>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    description: '',
    image_url: ''
  });

  // Verificar se o usuário é gerente
  useEffect(() => {
    if (!currentUser || currentUser.type !== 'mechanic' || currentUser.position !== 'gerente') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('cars')
        .insert([{
          brand: carForm.brand,
          model: carForm.model,
          year: carForm.year,
          price: carForm.price,
          description: carForm.description,
          image_url: carForm.image_url || null,
          created_by: currentUser?.id,
          status: 'available',
          is_active: true
        }]);

      if (error) throw error;

      // Criar notificação
      await supabase
        .from('notifications')
        .insert({
          type: 'general',
          message: `Novo veículo adicionado: ${carForm.brand} ${carForm.model} (${carForm.year}) - $${carForm.price.toLocaleString()}`,
          is_read: false
        });

      // Reset form
      setCarForm({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        price: 0,
        description: '',
        image_url: ''
      });

      setShowAddCarModal(false);
      refetchCars();
      alert('Veículo adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding car:', error);
      alert('Erro ao adicionar veículo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      refetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
      refetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!currentUser || currentUser.type !== 'mechanic' || currentUser.position !== 'gerente') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-black/90 backdrop-blur-sm border-b-2 border-purple-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">PAINEL DO GERENTE</h1>
                  <p className="text-purple-400 text-sm">Gestão de Carros e Notificações</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-white font-medium">{currentUser.full_name}</p>
              <p className="text-purple-400 text-sm">Gerente</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-black/50 p-1 rounded-xl mb-8 w-fit">
          <button
            onClick={() => setActiveTab('cars')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'cars'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Car className="h-4 w-4" />
            <span>Gestão de Carros</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors relative ${
              activeTab === 'notifications'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Cars Tab */}
        {activeTab === 'cars' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Add Car Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gestão de Veículos</h2>
              <button
                onClick={() => setShowAddCarModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Veículo</span>
              </button>
            </div>

            {/* Cars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className="bg-black/50 rounded-xl border border-gray-800 hover:border-purple-600 transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-w-16 aspect-h-9 relative">
                    <img
                      src={car.image_url || 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=800'}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-lg font-bold">
                      ${car.price.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2">
                      {car.brand} {car.model}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">Ano: {car.year}</p>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {car.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        car.status === 'available' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {car.status === 'available' ? 'Disponível' : 'Vendido'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Notificações</h2>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Marcar Todas como Lidas</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-400 mb-2">
                    Nenhuma notificação
                  </h3>
                  <p className="text-gray-500">
                    As notificações aparecerão aqui quando houver atividades no sistema
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-black/50 rounded-xl p-4 border transition-all duration-300 ${
                      notification.is_read 
                        ? 'border-gray-800' 
                        : 'border-purple-600 bg-purple-600/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className={`h-4 w-4 ${
                            notification.is_read ? 'text-gray-400' : 'text-purple-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            notification.is_read ? 'text-gray-400' : 'text-purple-400'
                          }`}>
                            {notification.type === 'car_sale' && 'Venda de Veículo'}
                            {notification.type === 'invoice' && 'Nova Nota Fiscal'}
                            {notification.type === 'mechanic_registration' && 'Registro de Mecânico'}
                            {notification.type === 'general' && 'Geral'}
                          </span>
                          {!notification.is_read && (
                            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                              Nova
                            </span>
                          )}
                        </div>
                        <p className={`${
                          notification.is_read ? 'text-gray-400' : 'text-white'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          {new Date(notification.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      
                      {!notification.is_read && (
                        <button
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="text-purple-400 hover:text-purple-300 p-1"
                          title="Marcar como lida"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Car Modal */}
      {showAddCarModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-purple-600"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Adicionar Veículo</h3>
              <button
                onClick={() => setShowAddCarModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddCar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Marca</label>
                  <input
                    type="text"
                    value={carForm.brand}
                    onChange={(e) => setCarForm(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-600 focus:outline-none"
                    placeholder="Ex: Toyota"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Modelo</label>
                  <input
                    type="text"
                    value={carForm.model}
                    onChange={(e) => setCarForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-600 focus:outline-none"
                    placeholder="Ex: Corolla"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Ano</label>
                  <input
                    type="number"
                    value={carForm.year}
                    onChange={(e) => setCarForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-600 focus:outline-none"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Preço</label>
                  <input
                    type="number"
                    value={carForm.price}
                    onChange={(e) => setCarForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-600 focus:outline-none"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">URL da Imagem (Opcional)</label>
                <input
                  type="url"
                  value={carForm.image_url}
                  onChange={(e) => setCarForm(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-600 focus:outline-none"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Descrição</label>
                <textarea
                  value={carForm.description}
                  onChange={(e) => setCarForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-purple-600 focus:outline-none"
                  rows={3}
                  placeholder="Descreva o veículo..."
                  required
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCarModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;