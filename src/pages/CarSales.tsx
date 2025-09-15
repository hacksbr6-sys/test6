import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, DollarSign, Calendar, User, Check, X } from 'lucide-react';
import { useCars } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { getCurrentUser, hasPermission } from '../lib/auth';
import type { Car as CarType } from '../types';

const CarSales: React.FC = () => {
  const { cars, loading } = useCars();
  const currentUser = getCurrentUser();
  const canBuyCars = currentUser ? true : true; // Allow both logged and non-logged users to request
  const canSellCars = hasPermission('sell_cars');
  const canManagePurchaseRequests = hasPermission('manage_purchase_requests');
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [playerData, setPlayerData] = useState({ id: '', name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPurchaseRequests, setShowPurchaseRequests] = useState(false);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);

  const handlePurchaseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar || !playerData.id || !playerData.name || !playerData.phone) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('car_resale_requests')
        .insert([
          {
            car_id: selectedCar.id,
            customer_id: playerData.id,
            customer_name: playerData.name,
            contact: playerData.phone,
            price_offered: selectedCar.price
          }
        ]);

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          type: 'car_sale',
          message: `Nova solicitação de compra: ${selectedCar.brand} ${selectedCar.model} por ${playerData.name} (ID: ${playerData.id}, Tel: ${playerData.phone})`,
          is_read: false
        });

      setShowSuccess(true);
      setSelectedCar(null);
      setPlayerData({ id: '', name: '', phone: '' });
    } catch (error) {
      console.error('Error submitting purchase request:', error);
      alert('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchPurchaseRequests = async () => {
    if (!canManagePurchaseRequests) return;
    
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          cars (
            id,
            brand,
            model,
            year,
            price
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchaseRequests(data || []);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
    }
  };

  const handlePurchaseRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('purchase_requests')
        .update({ 
          status: action,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Atualizar lista
      setPurchaseRequests(prev => prev.filter(req => req.id !== requestId));
      
      alert(`Solicitação ${action === 'approved' ? 'aprovada' : 'recusada'} com sucesso!`);
    } catch (error) {
      console.error('Error updating purchase request:', error);
      alert('Erro ao processar solicitação');
    }
  };

  React.useEffect(() => {
    if (canManagePurchaseRequests) {
      fetchPurchaseRequests();
    }
  }, [canManagePurchaseRequests]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-white">Carregando carros disponíveis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <span className="text-red-600">REVENDA</span> DE CARROS
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Os melhores veículos da cidade com preços que cabem no seu bolso
          </p>
          
          {/* Purchase Requests Button for Encarregados and above */}
          {canManagePurchaseRequests && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setShowPurchaseRequests(!showPurchaseRequests);
                  if (!showPurchaseRequests) fetchPurchaseRequests();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                {showPurchaseRequests ? 'Ocultar' : 'Ver'} Solicitações de Compra ({purchaseRequests.length})
              </button>
            </div>
          )}
        </motion.div>

        {/* Purchase Requests Management */}
        {showPurchaseRequests && canManagePurchaseRequests && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/50 rounded-xl p-6 border border-gray-800 mb-8"
          >
            <h3 className="text-xl font-bold text-white mb-4">Solicitações de Compra Pendentes</h3>
            
            {purchaseRequests.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhuma solicitação pendente</p>
            ) : (
              <div className="space-y-4">
                {purchaseRequests.map((request) => (
                  <div key={request.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-white font-bold mb-2">
                          {request.cars?.brand} {request.cars?.model} ({request.cars?.year})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">Cliente:</span>
                            <p className="text-white font-medium">{request.client_name}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">ID:</span>
                            <p className="text-white">{request.client_id}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Contato:</span>
                            <p className="text-white">{request.contact}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Valor:</span>
                            <p className="text-green-400 font-bold">${request.price_offered.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePurchaseRequestAction(request.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <Check className="h-4 w-4" />
                          <span>Aprovar</span>
                        </button>
                        <button
                          onClick={() => handlePurchaseRequestAction(request.id, 'rejected')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <X className="h-4 w-4" />
                          <span>Recusar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Cars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {cars.map((car, index) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/50 rounded-xl border border-gray-800 hover:border-red-600 transition-all duration-300 overflow-hidden group"
            >
              <div className="aspect-w-16 aspect-h-9 relative">
                <img
                  src={car.image_url || 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg font-bold">
                  ${car.price.toLocaleString()}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  {car.brand} {car.model}
                </h3>
                <div className="flex items-center space-x-4 text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{car.year}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>${car.price.toLocaleString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedCar(car)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  Solicitar Compra
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Purchase Modal */}
        {selectedCar && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-red-600"
            >
              <h3 className="text-2xl font-bold text-white mb-4">
                Solicitar Compra
              </h3>
              
              <div className="bg-black/50 p-4 rounded-lg mb-6">
                <p className="text-gray-400 mb-2">Veículo selecionado:</p>
                <p className="text-white font-bold text-lg">
                  {selectedCar.brand} {selectedCar.model} ({selectedCar.year})
                </p>
                <p className="text-red-400 font-bold text-xl">
                  ${selectedCar.price.toLocaleString()}
                </p>
              </div>

              <form onSubmit={handlePurchaseRequest}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {currentUser ? 'ID do Jogador' : 'ID do Jogador'}
                    </label>
                    <input
                      type="text"
                      value={playerData.id}
                      onChange={(e) => setPlayerData(prev => ({ ...prev, id: e.target.value }))}
                      className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                      placeholder={currentUser ? "Seu ID no servidor" : "Ex: 12345"}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {currentUser ? 'Nome do Jogador' : 'Nome do Jogador'}
                    </label>
                    <input
                      type="text"
                      value={playerData.name}
                      onChange={(e) => setPlayerData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                      placeholder={currentUser ? `${currentUser.full_name}` : "Seu nome no servidor"}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Contato (Telefone/Discord)
                    </label>
                    <input
                      type="text"
                      value={playerData.phone}
                      onChange={(e) => setPlayerData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
                      placeholder="(11) 99999-9999 ou Discord#1234"
                      required
                    />
                  </div>
                  
                  {currentUser && (
                    <div className="bg-blue-600/10 border border-blue-600 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-blue-400">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">Usuário Logado</span>
                      </div>
                      <p className="text-blue-300 text-xs mt-1">
                        {currentUser.full_name} ({currentUser.type === 'mechanic' ? 'Mecânico' : 'Cliente'})
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedCar(null)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Confirmar Solicitação'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-green-600 text-center"
            >
              <div className="text-green-600 mb-4">
                <Car className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Solicitação Enviada!
              </h3>
              <p className="text-gray-400 mb-6">
                Sua solicitação de compra foi enviada com sucesso. Nossa equipe entrará em contato em breve.
              </p>
              <button
                onClick={() => setShowSuccess(false)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Continuar Navegando
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarSales;