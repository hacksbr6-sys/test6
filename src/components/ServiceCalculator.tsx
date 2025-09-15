import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, Calculator, FileText, User, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useServices } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { getCurrentUser, hasPermission } from '../lib/auth';
import type { Service, ServiceOrderItem } from '../types';
import InvoiceGenerator from './InvoiceGenerator';

interface ExtraPart {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CalculatorState {
  selectedServices: ServiceOrderItem[];
  extraPartsValue: number;
  clientType: 'cliente' | 'policial' | 'samu';
  partsTaxPercent: number;
  discountValue: number;
  discountPercent: number;
  clientId: string;
  clientData: any;
  mechanicName: string;
  location: 'internal' | 'external';
}

const ServiceCalculator: React.FC = () => {
  const { services, loading } = useServices();
  const currentUser = getCurrentUser();
  const canGenerateInvoices = hasPermission('generate_invoices');
  const [calculator, setCalculator] = useState<CalculatorState>({
    selectedServices: [],
    extraPartsValue: 0,
    clientType: 'cliente',
    partsTaxPercent: 0,
    discountValue: 0,
    discountPercent: 0,
    clientId: '',
    clientData: null,
    mechanicName: '',
    location: 'internal'
  });
  
  const [showInvoice, setShowInvoice] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [searchingClient, setSearchingClient] = useState(false);

  // Puxar nome do mecânico automaticamente quando componente carrega
  useEffect(() => {
    if (currentUser && currentUser.type === 'mechanic') {
      setCalculator(prev => ({
        ...prev,
        mechanicName: currentUser.full_name
      }));
    }
  }, [currentUser]);

  // Buscar dados do cliente quando ID é inserido
  const searchClientData = async (clientId: string) => {
    if (!clientId.trim()) {
      setCalculator(prev => ({ ...prev, clientData: null }));
      return;
    }

    setSearchingClient(true);
    try {
      // Buscar primeiro na tabela de clientes
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientData && !clientError) {
        setCalculator(prev => ({ 
          ...prev, 
          clientData: {
            ...clientData,
            type: 'registered_client'
          }
        }));
      } else {
        // Se não encontrou como cliente, buscar como mecânico
        const { data: mechanicData, error: mechanicError } = await supabase
          .from('mechanics')
          .select('*')
          .eq('id', clientId)
          .single();

        if (mechanicData && !mechanicError) {
          setCalculator(prev => ({ 
            ...prev, 
            clientData: {
              ...mechanicData,
              type: 'registered_mechanic'
            }
          }));
        } else {
          // Cliente não registrado
          setCalculator(prev => ({ 
            ...prev, 
            clientData: { type: 'unregistered' }
          }));
        }
      }
    } catch (error) {
      console.error('Error searching client:', error);
      setCalculator(prev => ({ 
        ...prev, 
        clientData: { type: 'unregistered' }
      }));
    } finally {
      setSearchingClient(false);
    }
  };

  // Debounce para busca do cliente
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (calculator.clientId) {
        searchClientData(calculator.clientId);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [calculator.clientId]);

  // Atualizar taxa automaticamente quando valor das peças ou tipo de cliente muda
  useEffect(() => {
    if (calculator.extraPartsValue > 0) {
      let taxPercent = 30; // Default para clientes
      if (calculator.clientType === 'policial') taxPercent = 20;
      if (calculator.clientType === 'samu') taxPercent = 15;
      
      setCalculator(prev => ({ 
        ...prev, 
        partsTaxPercent: taxPercent 
      }));
    }
  }, [calculator.extraPartsValue, calculator.clientType]);

  const addService = (service: Service) => {
    const existingService = calculator.selectedServices.find(s => s.service_id === service.id);
    
    if (existingService) {
      setCalculator(prev => ({
        ...prev,
        selectedServices: prev.selectedServices.map(s =>
          s.service_id === service.id
            ? { 
                ...s, 
                quantity: s.quantity + 1,
                subtotal: (Number(s.is_external ? service.price_offsite : service.price_inshop) || 0) * (s.quantity + 1)
              }
            : s
        )
      }));
    } else {
      const isExternal = calculator.location === 'external';
      const price = Number(isExternal ? service.price_offsite : service.price_inshop) || 0;
      
      setCalculator(prev => ({
        ...prev,
        selectedServices: [
          ...prev.selectedServices,
          {
            service_id: service.id,
            quantity: 1,
            is_external: isExternal,
            subtotal: price
          }
        ]
      }));
    }
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      setCalculator(prev => ({
        ...prev,
        selectedServices: prev.selectedServices.filter(s => s.service_id !== serviceId)
      }));
    } else {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;
      
      setCalculator(prev => ({
        ...prev,
        selectedServices: prev.selectedServices.map(s =>
          s.service_id === serviceId ? {
            ...s,
            quantity,
            subtotal: (Number(s.is_external ? service.price_offsite : service.price_inshop) || 0) * quantity
          } : s
        )
      }));
    }
  };

  const addExtraPart = () => {
    const newPart: ExtraPart = {
      id: Math.random().toString(),
      name: '',
      price: 0,
      quantity: 1
    };
    
    setCalculator(prev => ({
      ...prev,
      extraParts: [...prev.extraParts, newPart]
    }));
  };

  const updateExtraPart = (id: string, field: string, value: any) => {
    setCalculator(prev => ({
      ...prev,
      extraParts: prev.extraParts.map(part =>
        part.id === id ? { ...part, [field]: value } : part
      )
    }));
  };

  const removeExtraPart = (id: string) => {
    setCalculator(prev => ({
      ...prev,
      extraParts: prev.extraParts.filter(part => part.id !== id)
    }));
  };

  // Calculate totals with proper number validation
  const calculateTotals = () => {
    const servicesSubtotal = calculator.selectedServices.reduce((total, item) => {
      const subtotal = Number(item.subtotal) || 0;
      return total + subtotal;
    }, 0);

    const partsSubtotal = Number(calculator.extraPartsValue) || 0;

    const partsTaxPercent = Number(calculator.partsTaxPercent) || 0;
    const partsTax = (partsSubtotal * partsTaxPercent) / 100;
    const subtotal = servicesSubtotal + partsSubtotal + partsTax;
    
    const discountValue = Number(calculator.discountValue) || 0;
    const discountPercent = Number(calculator.discountPercent) || 0;
    const discountAmount = discountValue + (subtotal * discountPercent) / 100;
    const total = Math.max(0, subtotal - discountAmount);

    return {
      servicesSubtotal: Number(servicesSubtotal.toFixed(2)),
      partsSubtotal: Number(partsSubtotal.toFixed(2)),
      partsTax: Number(partsTax.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  };

  const totals = calculateTotals();

  const generateInvoice = async () => {
    if (!calculator.clientId || !calculator.mechanicName) {
      alert('Preencha o ID do cliente e nome do mecânico');
      return;
    }

    if (calculator.selectedServices.length === 0) {
      alert('Adicione pelo menos um serviço');
      return;
    }

    // Verificar se usuário tem permissão para gerar notas fiscais
    if (!hasPermission('generate_invoices')) {
      alert('Você não tem permissão para gerar notas fiscais');
      return;
    }
    try {
      // Calculate totals with proper validation
      const calculatedTotals = calculateTotals();
      
      // Generate invoice number
      const invoiceNumber = Date.now();
      
      // Prepare invoice data with all required fields and proper defaults
      const invoiceData = {
        customer_id: calculator.clientId || "teste",
        mechanic_name: calculator.mechanicName || "desconhecido", 
        mechanic_uuid: currentUser?.id,
        client_uuid: null, // Will be set when we have client lookup
        location: calculator.location === 'external' ? 'externo' : 'oficina',
        parts_extra_value: Number(calculator.extraPartsValue) || 0,
        parts_fee_pct: Number(calculator.partsTaxPercent) || 0,
        discount_pct: Number(calculator.discountPercent) || 0,
        discount_value: Number(calculator.discountValue) || 0,
        subtotal: Number(calculatedTotals.subtotal) || 0,
        total: Number(calculatedTotals.total) || 0,
        invoice_number: invoiceNumber,
        order_data: {
          client_id: calculator.clientId || "teste",
          mechanic_name: calculator.mechanicName || "desconhecido",
          location: calculator.location,
          services: calculator.selectedServices.map(service => ({
            service_id: service.service_id || "",
            quantity: Number(service.quantity) || 0,
            is_external: Boolean(service.is_external),
            subtotal: Number(service.subtotal) || 0
          })),
          extra_parts_value: Number(calculator.extraPartsValue) || 0,
          client_type: calculator.clientType || 'cliente',
          parts_tax_percent: Number(calculator.partsTaxPercent) || 0,
          discount_value: Number(calculator.discountValue) || 0,
          discount_percent: Number(calculator.discountPercent) || 0,
          subtotal: Number(calculatedTotals.subtotal) || 0,
          total: Number(calculatedTotals.total) || 0
        }
      };

      // Validate that all numeric fields are valid numbers
      const numericFields = ['parts_extra_value', 'parts_fee_pct', 'discount_pct', 'discount_value', 'subtotal', 'total'];
      for (const field of numericFields) {
        if (isNaN(invoiceData[field as keyof typeof invoiceData] as number)) {
          invoiceData[field as keyof typeof invoiceData] = 0 as any;
        }
      }

      // Save invoice with all required fields
      const { data: insertedInvoiceRecord, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice error:', invoiceError);
        throw invoiceError;
      }

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          type: 'invoice',
          message: `Nova nota fiscal gerada: MGU-${invoiceNumber} - Cliente: ${calculator.clientId}`,
          is_read: false
        });

      // Prepare invoice for display
      const invoiceForDisplay = {
        ...insertedInvoiceRecord,
        clientData: calculator.clientData,
        services: calculator.selectedServices.map(item => {
          const service = services.find(s => s.id === item.service_id);
          return { ...item, service };
        }),
        totals: calculatedTotals,
        created_at: new Date().toISOString(),
        invoice_number: invoiceNumber
      };
      
      setGeneratedInvoice(invoiceForDisplay);
      setShowInvoice(true);

      // Reset form
      setCalculator({
        selectedServices: [],
        extraPartsValue: 0,
        clientType: 'cliente',
        partsTaxPercent: 0,
        discountValue: 0,
        discountPercent: 0,
        clientId: '',
        clientData: null,
        mechanicName: currentUser?.type === 'mechanic' ? currentUser.full_name : '',
        location: 'internal'
      });

    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Erro ao gerar nota fiscal. Verifique os dados e tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Client Information */}
      <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4">Informações do Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white font-medium mb-2">ID do Cliente</label>
            <div className="relative">
              <input
                type="text"
                value={calculator.clientId}
                onChange={(e) => setCalculator(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 pr-10 text-white focus:border-red-600 focus:outline-none"
                placeholder="Ex: 12345"
              />
              {searchingClient && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Nome do Mecânico</label>
            <input
              type="text"
              value={calculator.mechanicName}
              onChange={(e) => setCalculator(prev => ({ ...prev, mechanicName: e.target.value }))}
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none disabled:opacity-50"
              placeholder="Seu nome"
              disabled={currentUser?.type === 'mechanic'}
            />
            {currentUser?.type === 'mechanic' && (
              <p className="text-green-400 text-xs mt-1">✓ Nome preenchido automaticamente</p>
            )}
          </div>
        </div>

        {/* Client Data Display */}
        {calculator.clientData && (
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2 mb-3">
              <User className="h-4 w-4 text-blue-400" />
              <span className="text-white font-medium">Dados do Cliente</span>
            </div>
            
            {calculator.clientData.type === 'registered_client' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Nome:</span>
                  <p className="text-white font-medium">{calculator.clientData.full_name}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Email:</span>
                  <p className="text-white">{calculator.clientData.email}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Telefone:</span>
                  <p className="text-white">{calculator.clientData.phone || 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Status:</span>
                  <p className="text-green-400 font-medium">Cliente Registrado</p>
                </div>
              </div>
            )}
            
            {calculator.clientData.type === 'registered_mechanic' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-400 text-sm">Nome:</span>
                  <p className="text-white font-medium">{calculator.clientData.full_name}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Email:</span>
                  <p className="text-white">{calculator.clientData.email}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Cargo:</span>
                  <p className="text-blue-400 font-medium">
                    {calculator.clientData.position === 'regional' ? 'Regional' :
                     calculator.clientData.position === 'sub_regional' ? 'Sub Regional' :
                     calculator.clientData.position === 'gerente' ? 'Gerente' :
                     calculator.clientData.position === 'encarregado' ? 'Encarregado' :
                     'Colaborador'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Status:</span>
                  <p className="text-purple-400 font-medium">Mecânico Registrado</p>
                </div>
              </div>
            )}
            
            {calculator.clientData.type === 'unregistered' && (
              <div className="text-center py-2">
                <p className="text-yellow-400">⚠️ Cliente não encontrado no sistema</p>
                <p className="text-gray-400 text-sm">Será tratado como cliente não registrado</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
          <div>
            <label className="block text-white font-medium mb-2">Local do Atendimento</label>
            <select
              value={calculator.location}
              onChange={(e) => setCalculator(prev => ({ ...prev, location: e.target.value as 'internal' | 'external' }))}
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
            >
              <option value="internal">Dentro da Oficina</option>
              <option value="external">Fora da Oficina</option>
            </select>
          </div>
        </div>
      </div>

      {/* Available Services */}
      <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4">Serviços Disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-red-600 transition-colors"
            >
              <h4 className="text-white font-medium mb-2">{service.name}</h4>
              <p className="text-gray-400 text-sm mb-3">{service.description}</p>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-green-400 font-bold">
                    Interno: ${Number(service.price_inshop || 0).toLocaleString()}
                  </p>
                  <p className="text-yellow-400 font-bold">
                    Externo: ${Number(service.price_offsite || 0).toLocaleString()}
                  </p>
                </div>
                {service.requires_tow && (
                  <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded">
                    Guincho
                  </span>
                )}
              </div>
              <button
                onClick={() => addService(service)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Adicionar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Services */}
      {calculator.selectedServices.length > 0 && (
        <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-4">Serviços Selecionados</h3>
          <div className="space-y-4">
            {calculator.selectedServices.map((item) => {
              const service = services.find(s => s.id === item.service_id);
              if (!service) return null;

              const price = Number(item.is_external ? service.price_offsite : service.price_inshop) || 0;
              
              return (
                <div key={item.service_id} className="bg-gray-900 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{service.name}</h4>
                    <p className="text-gray-400 text-sm">
                      {item.is_external ? 'Atendimento Externo' : 'Atendimento Interno'} - ${price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateServiceQuantity(item.service_id, item.quantity - 1)}
                        className="bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateServiceQuantity(item.service_id, item.quantity + 1)}
                        className="bg-red-600 hover:bg-red-700 text-white p-1 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-white font-bold w-20 text-right">
                      ${(Number(item.subtotal) || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Extra Parts */}
      <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4">Configurações Adicionais</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">Valor Peças Extras</label>
            <input
              type="number"
              value={calculator.extraPartsValue || 0}
              onChange={(e) => setCalculator(prev => ({ ...prev, extraPartsValue: Number(e.target.value) || 0 }))}
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
              placeholder="0"
            />
            {calculator.extraPartsValue > 0 && (
              <p className="text-blue-400 text-xs mt-1">
                Taxa de {calculator.partsTaxPercent}% será aplicada automaticamente
              </p>
            )}
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Tipo de Cliente</label>
            <select
              value={calculator.clientType || 'cliente'}
              onChange={(e) => {
                const clientType = e.target.value;
                setCalculator(prev => ({ 
                  ...prev, 
                  clientType
                }));
              }}
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
            >
              <option value="cliente">Cliente (30%)</option>
              <option value="policial">Policial (20%)</option>
              <option value="samu">SAMU (15%)</option>
            </select>
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Desconto (Valor)</label>
            <input
              type="number"
              value={calculator.discountValue}
              onChange={(e) => setCalculator(prev => ({ ...prev, discountValue: Number(e.target.value) || 0 }))}
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Desconto (%)</label>
            <input
              type="number"
              value={calculator.discountPercent}
              onChange={(e) => setCalculator(prev => ({ ...prev, discountPercent: Number(e.target.value) || 0 }))}
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-red-600 focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Totals Summary */}
      <div className="bg-black/50 rounded-xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Resumo do Orçamento
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal dos Serviços:</span>
            <span>${totals.servicesSubtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Subtotal das Peças:</span>
            <span>${totals.partsSubtotal.toLocaleString()}</span>
          </div>
          {totals.partsTax > 0 && (
            <div className="flex justify-between text-yellow-400">
              <span>Taxa de Peças ({calculator.partsTaxPercent}%):</span>
              <span>${totals.partsTax.toLocaleString()}</span>
            </div>
          )}
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Desconto Total:</span>
              <span>-${totals.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-gray-700 pt-3">
            <div className="flex justify-between text-white text-2xl font-bold">
              <span>Total Geral:</span>
              <span className="text-red-400">${totals.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={generateInvoice}
          disabled={!canGenerateInvoices || !calculator.clientId || !calculator.mechanicName || calculator.selectedServices.length === 0}
          className={`w-full mt-6 ${
            (!canGenerateInvoices || !calculator.clientId || !calculator.mechanicName || calculator.selectedServices.length === 0)
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700'
          } text-white py-4 rounded-lg font-bold transition-colors flex items-center justify-center`}
        >
          <FileText className="h-5 w-5 mr-2" />
          {!canGenerateInvoices ? 'Apenas Mecânicos Podem Gerar Notas Fiscais' : 
           (!calculator.clientId || !calculator.mechanicName || calculator.selectedServices.length === 0) ? 
           'Preencha os Dados para Gerar Nota Fiscal' : 'Gerar Nota Fiscal'}
        </button>
        
        {!canGenerateInvoices && (
          <p className="text-center text-gray-400 text-sm mt-2">
            Você precisa estar logado como mecânico para gerar notas fiscais. 
            <Link to="/login" className="text-red-400 hover:text-red-300 underline ml-1">
              Fazer login
            </Link>
          </p>
        )}
      </div>

      {/* Invoice Modal */}
      {showInvoice && generatedInvoice && (
        <InvoiceGenerator
          invoice={generatedInvoice}
          onClose={() => {
            setShowInvoice(false);
            setGeneratedInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default ServiceCalculator;