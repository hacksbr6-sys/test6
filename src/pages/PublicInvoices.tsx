import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Eye, Calendar, User, DollarSign, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { getCurrentUser, hasPermission } from '../lib/auth';
import InvoiceGenerator from '../components/InvoiceGenerator';

interface Invoice {
  id: string;
  invoice_number: number;
  customer_id: string;
  mechanic_name: string;
  location: string;
  tow_required: boolean;
  parts_extra_value: number;
  parts_fee_pct: number;
  discount_pct: number;
  discount_value: number;
  subtotal: number;
  total: number;
  created_at: string;
  order_data: any;
}

const PublicInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const currentUser = getCurrentUser();
  const canViewAllInvoices = true; // Permitir que todos vejam todas as notas fiscais
  const canDeleteInvoices = hasPermission('delete_invoices');

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    // Filter invoices based on search term
    if (searchTerm.trim() === '') {
      setFilteredInvoices(invoices);
    } else {
      const filtered = invoices.filter(invoice => 
        invoice.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_number.toString().includes(searchTerm) ||
        invoice.mechanic_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInvoices(filtered);
    }
  }, [searchTerm, invoices]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // Buscar todas as notas fiscais sem filtro por usuário
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!canDeleteInvoices) {
      alert('Você não tem permissão para deletar notas fiscais');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar esta nota fiscal? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      // Atualizar lista
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      alert('Nota fiscal deletada com sucesso');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Erro ao deletar nota fiscal');
    }
  };

  const viewInvoiceDetails = async (invoice: Invoice) => {
    try {
      // Prepare invoice data for the InvoiceGenerator component
      const invoiceForDisplay = {
        ...invoice,
        services: invoice.order_data?.services || [],
        totals: {
          servicesSubtotal: invoice.subtotal - (invoice.parts_extra_value || 0) - ((invoice.parts_extra_value || 0) * (invoice.parts_fee_pct || 0) / 100),
          partsSubtotal: invoice.parts_extra_value || 0,
          partsTax: ((invoice.parts_extra_value || 0) * (invoice.parts_fee_pct || 0)) / 100,
          subtotal: invoice.subtotal,
          discountAmount: invoice.discount_value + (invoice.subtotal * (invoice.discount_pct || 0)) / 100,
          total: invoice.total
        }
      };
      
      setSelectedInvoice(invoiceForDisplay);
      setShowInvoiceDetails(true);
    } catch (error) {
      console.error('Error loading invoice details:', error);
      alert('Erro ao carregar detalhes da nota fiscal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-white">Carregando notas fiscais...</p>
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
            <span className="text-red-600">NOTAS</span> FISCAIS
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Consulte e visualize todas as notas fiscais emitidas pela Mecânica Guaianases
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/50 rounded-xl p-6 border border-gray-800 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID do cliente, número da nota ou mecânico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white focus:border-red-600 focus:outline-none"
              />
            </div>
            <div className="text-gray-400 text-sm whitespace-nowrap">
              {filteredInvoices.length} nota(s) encontrada(s)
            </div>
          </div>
        </motion.div>

        {/* Invoices Grid */}
        <div className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">
                {searchTerm ? 'Nenhuma nota fiscal encontrada' : 'Nenhuma nota fiscal disponível'}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Tente buscar com outros termos' : 'As notas fiscais aparecerão aqui quando forem geradas'}
              </p>
            </motion.div>
          ) : (
            filteredInvoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-black/50 rounded-xl border border-gray-800 hover:border-red-600 transition-all duration-300 p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Invoice Info */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText className="h-4 w-4 text-red-400" />
                        <span className="text-gray-400 text-sm">Número:</span>
                      </div>
                      <p className="text-white font-bold">MGU-{invoice.invoice_number}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-400 text-sm">Cliente:</span>
                      </div>
                      <p className="text-white font-medium">{invoice.customer_id}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <span className="text-gray-400 text-sm">Total:</span>
                      </div>
                      <p className="text-green-400 font-bold">${invoice.total.toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="h-4 w-4 text-yellow-400" />
                        <span className="text-gray-400 text-sm">Data:</span>
                      </div>
                      <p className="text-white">
                        {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="text-sm">
                      <p className="text-gray-400">Mecânico: <span className="text-white">{invoice.mechanic_name}</span></p>
                      <p className="text-gray-400">
                        Local: <span className={`${invoice.location === 'externo' ? 'text-orange-400' : 'text-green-400'}`}>
                          {invoice.location === 'externo' ? 'Externo' : 'Oficina'}
                        </span>
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewInvoiceDetails(invoice)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 whitespace-nowrap"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver Detalhes</span>
                      </button>
                      
                      {canDeleteInvoices && (
                        <button
                          onClick={() => deleteInvoice(invoice.id)}
                          className="bg-red-800 hover:bg-red-900 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
                          title="Deletar nota fiscal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Invoice Details Modal */}
        {showInvoiceDetails && selectedInvoice && (
          <InvoiceGenerator
            invoice={selectedInvoice}
            onClose={() => {
              setShowInvoiceDetails(false);
              setSelectedInvoice(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PublicInvoices;