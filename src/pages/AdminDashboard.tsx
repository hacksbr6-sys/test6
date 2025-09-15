import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Bell, 
  Save,
  Eye,
  AlertCircle,
  Settings,
  UserCheck,
  UserX,
  BarChart3,
  DollarSign,
  FileText,
  TrendingUp,
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  Shield,
  Calendar,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCurrentUser, hasPermission } from '../lib/auth';
import { useNotifications, useCars, useClients, useMechanics, useInvoices } from '../hooks/useSupabase';

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
  password: string;
}

interface DashboardStats {
  totalCars: number;
  totalMechanics: number;
  totalClients: number;
  totalInvoices: number;
  pendingApprovals: number;
  unreadNotifications: number;
  monthlyRevenue: number;
  activeCars: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { notifications, unreadCount, refetch: refetchNotifications } = useNotifications();
  const { cars, refetch: refetchCars } = useCars();
  const { clients, refetch: refetchClients } = useClients();
  const { mechanics, refetch: refetchMechanics } = useMechanics();
  const { invoices, refetch: refetchInvoices } = useInvoices();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'notifications' | 'cars' | 'mechanics' | 'clients' | 'invoices'>('dashboard');
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showEditMechanicModal, setShowEditMechanicModal] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState<DashboardStats>({
    totalCars: 0,
    totalMechanics: 0,
    totalClients: 0,
    totalInvoices: 0,
    pendingApprovals: 0,
    unreadNotifications: 0,
    monthlyRevenue: 0,
    activeCars: 0
  });
  
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
    password: ''
  });

  // Verificar se o usuário pode acessar o painel admin
  useEffect(() => {
    if (!currentUser || (currentUser.type !== 'admin' && !hasPermission('full_admin_access'))) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Calcular estatísticas
  useEffect(() => {
    const calculateStats = () => {
      const pendingMechanics = mechanics.filter(m => !m.approved).length;
      const activeCarsCount = cars.filter(c => c.status === 'available').length;
      const monthlyRevenue = invoices
        .filter(i => new Date(i.created_at).getMonth() === new Date().getMonth())
        .reduce((sum, i) => sum + (i.total || 0), 0);

      setStats({
        totalCars: cars.length,
        totalMechanics: mechanics.length,
        totalClients: clients.length,
        totalInvoices: invoices.length,
        pendingApprovals: pendingMechanics,
        unreadNotifications: unreadCount,
        monthlyRevenue,
        activeCars: activeCarsCount
      });
    };

    calculateStats();
  }, [cars, mechanics, clients, invoices, unreadCount]);

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
          message: `Novo veículo adicionado pelo ADMEC: ${carForm.brand} ${carForm.model} (${carForm.year}) - $${carForm.price.toLocaleString()}`,
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
      const updateData: any = {
        full_name: mechanicForm.full_name,
        email: mechanicForm.email,
        phone: mechanicForm.phone,
        position: mechanicForm.position
      };

      // Só atualizar senha se foi preenchida
      if (mechanicForm.password && mechanicForm.password.trim() !== '') {
        updateData.password = btoa(mechanicForm.password); // Base64 encoding
      }

      const { error } = await supabase
        .from('mechanics')
        .update(updateData)
        .eq('id', selectedMechanic.id);

      if (error) throw error;

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

  const approveMechanic = async (mechanicId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('mechanics')
        .update({ 
          approved,
          approved_at: approved ? new Date().toISOString() : null,
          approved_by: approved ? currentUser?.id : null
        })
        .eq('id', mechanicId);

      if (error) throw error;

      refetchMechanics();
      alert(`Mecânico ${approved ? 'aprovado' : 'rejeitado'} com sucesso!`);
    } catch (error) {
      console.error('Error updating mechanic approval:', error);
      alert('Erro ao atualizar aprovação do mecânico');
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
      password: ''
    });
    setShowEditMechanicModal(true);
  };

  const refreshData = () => {
    refetchCars();
    refetchMechanics();
    refetchClients();
    refetchInvoices();
    refetchNotifications();
  };

  const exportData = (type: string) => {
    // Implementar exportação de dados
    alert(`Exportando dados de ${type}...`);
  };

  // Filtrar dados baseado na busca
  const filteredMechanics = mechanics.filter(mechanic => 
    mechanic.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mechanic.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCars = cars.filter(car => 
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(client => 
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser || (currentUser.type !== 'admin' && !hasPermission('full_admin_access'))) {
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
                <span>Voltar ao Início</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="bg-red-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">PAINEL ADMINISTRATIVO</h1>
                  <p className="text-red-400 text-sm">Sistema de Gestão Completa</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden md:inline">Atualizar</span>
              </button>
              
              <div className="text-right">
                <p className="text-white font-medium">{currentUser.full_name}</p>
                <p className="text-red-400 text-sm">
                  {currentUser.type === 'admin' ? 'Administrador' : 'Sub Regional/Regional'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-black/50 p-1 rounded-xl mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors relative ${
              activeTab === 'notifications'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('cars')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'cars'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Car className="h-4 w-4" />
            <span>Veículos</span>
          </button>
          <button
            onClick={() => setActiveTab('mechanics')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'mechanics'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Mecânicos</span>
            {stats.pendingApprovals > 0 && (
              <span className="bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {stats.pendingApprovals}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'clients'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Notas Fiscais</span>
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total de Clientes</p>
                    <p className="text-3xl font-bold">{stats.totalClients}</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Mecânicos Ativos</p>
                    <p className="text-3xl font-bold">{mechanics.filter(m => m.approved).length}</p>
                  </div>
                  <UserCheck className="h-12 w-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Carros Disponíveis</p>
                    <p className="text-3xl font-bold">{stats.activeCars}</p>
                  </div>
                  <Car className="h-12 w-12 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">Receita Mensal</p>
                    <p className="text-3xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-yellow-200" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-6">Ações Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowAddCarModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3"
                >
                  <Plus className="h-5 w-5" />
                  <span>Adicionar Veículo</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('mechanics')}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3"
                >
                  <UserCheck className="h-5 w-5" />
                  <span>Aprovar Mecânicos</span>
                  {stats.pendingApprovals > 0 && (
                    <span className="bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {stats.pendingApprovals}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3"
                >
                  <Bell className="h-5 w-5" />
                  <span>Ver Notificações</span>
                  {unreadCount > 0 && (
                    <span className="bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-6">Atividade Recente</h3>
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center space-x-4 p-3 bg-gray-900 rounded-lg"
                  >
                    <div className={`p-2 rounded-full ${
                      notification.is_read ? 'bg-gray-700' : 'bg-red-600'
                    }`}>
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{notification.message}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(notification.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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

        {/* Cars Tab */}
        {activeTab === 'cars' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Gestão de Veículos</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar veículos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => exportData('cars')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
                <button
                  onClick={() => setShowAddCarModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Veículo</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Gestão de Mecânicos</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar mecânicos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-red-600 focus:outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="approved">Aprovados</option>
                  <option value="pending">Pendentes</option>
                </select>
                <button
                  onClick={() => exportData('mechanics')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredMechanics
                .filter(mechanic => {
                  if (filterStatus === 'approved') return mechanic.approved;
                  if (filterStatus === 'pending') return !mechanic.approved;
                  return true;
                })
                .map((mechanic) => (
                <div
                  key={mechanic.id}
                  className={`bg-black/50 rounded-xl p-4 border transition-all duration-300 ${
                    mechanic.approved 
                      ? 'border-gray-800' 
                      : 'border-yellow-600 bg-yellow-600/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{mechanic.full_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          mechanic.approved 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {mechanic.approved ? 'Aprovado' : 'Pendente'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          mechanic.position === 'colaborador' ? 'bg-blue-100 text-blue-600' :
                          mechanic.position === 'encarregado' ? 'bg-green-100 text-green-600' :
                          mechanic.position === 'gerente' ? 'bg-purple-100 text-purple-600' :
                          mechanic.position === 'sub_regional' ? 'bg-orange-100 text-orange-600' :
                          mechanic.position === 'regional' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {mechanic.position === 'colaborador' ? 'Colaborador' :
                           mechanic.position === 'encarregado' ? 'Encarregado' :
                           mechanic.position === 'gerente' ? 'Gerente' :
                           mechanic.position === 'sub_regional' ? 'Sub Regional' :
                           mechanic.position === 'regional' ? 'Regional' :
                           'Sem Cargo'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Email:</span>
                          <p className="text-white">{mechanic.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Telefone:</span>
                          <p className="text-white">{mechanic.phone || 'Não informado'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Registro:</span>
                          <p className="text-white">
                            {new Date(mechanic.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <p className={`font-medium ${mechanic.approved ? 'text-green-400' : 'text-yellow-400'}`}>
                            {mechanic.approved ? 'Ativo' : 'Aguardando'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditMechanic(mechanic)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </button>
                      
                      {!mechanic.approved ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => approveMechanic(mechanic.id, true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
                          >
                            <UserCheck className="h-4 w-4" />
                            <span>Aprovar</span>
                          </button>
                          <button
                            onClick={() => approveMechanic(mechanic.id, false)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
                          >
                            <UserX className="h-4 w-4" />
                            <span>Rejeitar</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => approveMechanic(mechanic.id, false)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
                        >
                          <UserX className="h-4 w-4" />
                          <span>Revogar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Clientes Registrados</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => exportData('clients')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="bg-black/50 rounded-xl p-4 border border-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{client.full_name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Email:</span>
                          <p className="text-white">{client.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Telefone:</span>
                          <p className="text-white">{client.phone || 'Não informado'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Endereço:</span>
                          <p className="text-white">{client.address || 'Não informado'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Registro:</span>
                          <p className="text-white">
                            {new Date(client.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                        Cliente Ativo
                      </span>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Notas Fiscais</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => exportData('invoices')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{stats.totalInvoices}</p>
                  <p className="text-gray-400">Total de Notas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">${stats.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-gray-400">Receita Mensal</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {invoices.filter(i => new Date(i.created_at).toDateString() === new Date().toDateString()).length}
                  </p>
                  <p className="text-gray-400">Notas Hoje</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-400 mb-4">
                  Para visualizar todas as notas fiscais detalhadamente, acesse a página dedicada:
                </p>
                <button
                  onClick={() => navigate('/invoices')}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center space-x-2 mx-auto"
                >
                  <FileText className="h-5 w-5" />
                  <span>Ver Todas as Notas Fiscais</span>
                </button>
              </div>
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

              <div>
                <label className="block text-white font-medium mb-2">Nova Senha (Opcional)</label>
                <input
                  type="password"
                  value={mechanicForm.password}
                  onChange={(e) => setMechanicForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                  placeholder="Deixe em branco para manter a atual"
                />
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

export default AdminDashboard;