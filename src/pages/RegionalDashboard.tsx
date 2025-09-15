import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Car, 
  FileText, 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Save,
  Eye,
  AlertCircle,
  Settings,
  Shield
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';
import { useNotifications, useCars, useMechanics, useClients, useInvoices } from '../hooks/useSupabase';

interface CarForm {
  brand: string;
  model: string;
  year: number;
  price: number;
  description: string;
  image_url: string;
}

interface MechanicForm {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  approved: boolean;
}

const RegionalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { notifications, unreadCount, refetch: refetchNotifications } = useNotifications();
  const { cars, refetch: refetchCars } = useCars();
  const { mechanics, refetch: refetchMechanics } = useMechanics();
  const { clients } = useClients();
  const { invoices, refetch: refetchInvoices } = useInvoices();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'cars' | 'mechanics' | 'invoices' | 'notifications'>('overview');
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showEditMechanicModal, setShowEditMechanicModal] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [carForm, setCarForm] = useState<CarForm>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    description: '',
    image_url: ''
  });

  const [mechanicForm, setMechanicForm] = useState<MechanicForm>({
    full_name: '',
    email: '',
    phone: '',
    position: 'colaborador',
    approved: false
  });

  // Verificar se o usuário é regional
  useEffect(() => {
    if (!currentUser || currentUser.type !== 'mechanic' || currentUser.position !== 'regional') {
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
          message: `Novo veículo adicionado pelo Regional: ${carForm.brand} ${carForm.model} (${carForm.year}) - $${carForm.price.toLocaleString()}`,
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

  const handleEditMechanic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMechanic) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('mechanics')
        .update({
          full_name: mechanicForm.full_name,
          email: mechanicForm.email,
          phone: mechanicForm.phone,
          position: mechanicForm.position,
          approved: mechanicForm.approved
        })
        .eq('id', selectedMechanic.id);

      if (error) throw error;

      // Criar notificação
      await supabase
        .from('notifications')
        .insert({
          type: 'general',
          message: `Mecânico ${mechanicForm.full_name} foi atualizado pelo Regional - Cargo: ${mechanicForm.position}, Status: ${mechanicForm.approved ? 'Aprovado' : 'Pendente'}`,
          is_read: false
        });

      setShowEditMechanicModal(false);
      setSelectedMechanic(null);
      refetchMechanics();
      alert('Mecânico atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating mechanic:', error);
      alert('Erro ao atualizar mecânico');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCar = async (carId: string) => {
    if (!confirm('Tem certeza que deseja deletar este veículo?')) return;

    try {
      const { error } = await supabase
        .from('cars')
        .update({ is_active: false })
        .eq('id', carId);

      if (error) throw error;

      refetchCars();
      alert('Veículo removido com sucesso!');
    } catch (error) {
      console.error('Error deleting car:', error);
      alert('Erro ao remover veículo');
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta nota fiscal? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      refetchInvoices();
      alert('Nota fiscal deletada com sucesso!');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Erro ao deletar nota fiscal');
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

  const openEditMechanic = (mechanic: any) => {
    setSelectedMechanic(mechanic);
    setMechanicForm({
      full_name: mechanic.full_name,
      email: mechanic.email,
      phone: mechanic.phone || '',
      position: mechanic.position || 'colaborador',
      approved: mechanic.approved
    });
    setShowEditMechanicModal(true);
  };

  if (!currentUser || currentUser.type !== 'mechanic' || currentUser.position !== 'regional') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-black/90 backdrop-blur-sm border-b-2 border-red-600">
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
                <div className="bg-red-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">PAINEL REGIONAL</h1>
                  <p className="text-red-400 text-sm">Acesso Total ao Sistema</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-white font-medium">{currentUser.full_name}</p>
              <p className="text-red-400 text-sm">Regional (Nível ADMEC)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-black/50 p-1 rounded-xl mb-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Settings },
            { id: 'cars', label: 'Gestão de Carros', icon: Car },
            { id: 'mechanics', label: 'Gestão de Mecânicos', icon: Users },
            { id: 'invoices', label: 'Notas Fiscais', icon: FileText },
            { id: 'notifications', label: 'Notificações', icon: Bell }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">Visão Geral do Sistema</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total de Carros</p>
                    <p className="text-2xl font-bold text-white">{cars.length}</p>
                  </div>
                  <Car className="h-8 w-8 text-red-400" />
                </div>
              </div>
              
              <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total de Mecânicos</p>
                    <p className="text-2xl font-bold text-white">{mechanics.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total de Clientes</p>
                    <p className="text-2xl font-bold text-white">{clients.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Notas Fiscais</p>
                    <p className="text-2xl font-bold text-white">{invoices.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-red-600/10 border border-red-600 rounded-xl p-6">
              <h3 className="text-xl font-bold text-red-400 mb-4">Permissões do Cargo Regional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-white font-medium">✅ Gestão Completa de Veículos</p>
                  <p className="text-white font-medium">✅ Gestão Completa de Mecânicos</p>
                  <p className="text-white font-medium">✅ Visualizar/Deletar Notas Fiscais</p>
                  <p className="text-white font-medium">✅ Gerenciar Notificações</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">✅ Aprovar/Reprovar Mecânicos</p>
                  <p className="text-white font-medium">✅ Alterar Cargos de Mecânicos</p>
                  <p className="text-white font-medium">✅ Acesso Total ao Sistema</p>
                  <p className="text-white font-medium">✅ Nível Equivalente ao ADMEC</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cars Tab */}
        {activeTab === 'cars' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gestão de Veículos</h2>
              <button
                onClick={() => setShowAddCarModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Veículo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className="bg-black/50 rounded-xl border border-gray-800 hover:border-red-600 transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-w-16 aspect-h-9 relative">
                    <img
                      src={car.image_url || 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=800'}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg font-bold">
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
                      <button
                        onClick={() => deleteCar(car.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remover veículo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mechanics Tab */}
        {activeTab === 'mechanics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">Gestão de Mecânicos</h2>
            
            <div className="space-y-4">
              {mechanics.map((mechanic) => (
                <div
                  key={mechanic.id}
                  className="bg-black/50 rounded-xl p-6 border border-gray-800 hover:border-red-600 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-gray-400 text-sm">Nome:</span>
                        <p className="text-white font-medium">{mechanic.full_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Email:</span>
                        <p className="text-white">{mechanic.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Cargo:</span>
                        <p className={`font-medium ${
                          mechanic.position === 'regional' ? 'text-red-400' :
                          mechanic.position === 'sub_regional' ? 'text-orange-400' :
                          mechanic.position === 'gerente' ? 'text-purple-400' :
                          mechanic.position === 'encarregado' ? 'text-green-400' :
                          'text-blue-400'
                        }`}>
                          {mechanic.position === 'regional' ? 'Regional' :
                           mechanic.position === 'sub_regional' ? 'Sub Regional' :
                           mechanic.position === 'gerente' ? 'Gerente' :
                           mechanic.position === 'encarregado' ? 'Encarregado' :
                           'Colaborador'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Status:</span>
                        <p className={`font-medium ${
                          mechanic.approved ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {mechanic.approved ? 'Aprovado' : 'Pendente'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditMechanic(mechanic)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-white">Gestão de Notas Fiscais</h2>
            
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-black/50 rounded-xl p-6 border border-gray-800 hover:border-red-600 transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-gray-400 text-sm">Número:</span>
                        <p className="text-white font-bold">MGU-{invoice.invoice_number}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Cliente:</span>
                        <p className="text-white">{invoice.customer_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Mecânico:</span>
                        <p className="text-white">{invoice.mechanic_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Total:</span>
                        <p className="text-green-400 font-bold">${invoice.total.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Deletar</span>
                      </button>
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
              <h2 className="text-2xl font-bold text-white">Notificações do Sistema</h2>
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
                        : 'border-red-600 bg-red-600/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className={`h-4 w-4 ${
                            notification.is_read ? 'text-gray-400' : 'text-red-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            notification.is_read ? 'text-gray-400' : 'text-red-400'
                          }`}>
                            {notification.type === 'car_sale' && 'Venda de Veículo'}
                            {notification.type === 'invoice' && 'Nova Nota Fiscal'}
                            {notification.type === 'mechanic_registration' && 'Registro de Mecânico'}
                            {notification.type === 'general' && 'Geral'}
                          </span>
                          {!notification.is_read && (
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
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
                          className="text-red-400 hover:text-red-300 p-1"
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
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-red-600"
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
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
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
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
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
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
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
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
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
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Descrição</label>
                <textarea
                  value={carForm.description}
                  onChange={(e) => setCarForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
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
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
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

      {/* Edit Mechanic Modal */}
      {showEditMechanicModal && selectedMechanic && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-red-600"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Editar Mecânico</h3>
              <button
                onClick={() => setShowEditMechanicModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditMechanic} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={mechanicForm.full_name}
                  onChange={(e) => setMechanicForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={mechanicForm.email}
                  onChange={(e) => setMechanicForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Telefone</label>
                <input
                  type="tel"
                  value={mechanicForm.phone}
                  onChange={(e) => setMechanicForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Cargo</label>
                <select
                  value={mechanicForm.position}
                  onChange={(e) => setMechanicForm(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                >
                  <option value="colaborador">Colaborador</option>
                  <option value="encarregado">Encarregado</option>
                  <option value="gerente">Gerente</option>
                  <option value="sub_regional">Sub Regional</option>
                  <option value="regional">Regional</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="approved"
                  checked={mechanicForm.approved}
                  onChange={(e) => setMechanicForm(prev => ({ ...prev, approved: e.target.checked }))}
                  className="w-4 h-4 text-red-600 bg-black/50 border-gray-700 rounded focus:ring-red-600"
                />
                <label htmlFor="approved" className="text-white font-medium">
                  Mecânico Aprovado
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditMechanicModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
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

export default RegionalDashboard;