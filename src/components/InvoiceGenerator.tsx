import React from 'react';
import { X, Printer, Download, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InvoiceProps {
  invoice: any;
  onClose: () => void;
}

const InvoiceGenerator: React.FC<InvoiceProps> = ({ invoice, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // For simplicity, we'll use the browser's print to PDF functionality
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
      >
        {/* Header Actions */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 print:hidden">
          <h2 className="text-2xl font-bold text-gray-900">Nota Fiscal</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Baixar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 print:p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-red-600 p-2 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-red-600">MECÂNICA GUAIANASES</h1>
                  <p className="text-gray-600">GuaianaseRP</p>
                </div>
              </div>
              <div className="text-gray-600 text-sm">
                <p>Oficina Mecânica Especializada</p>
                <p>Cidade: Guaianases</p>
                <p>Servidor: GuaianaseRP</p>
                <p>CNPJ: 12.345.678/0001-90</p>
                <p>Telefone: (11) 3456-7890</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-red-50 p-4 rounded-lg">
                <h2 className="text-xl font-bold text-red-600 mb-2">NOTA FISCAL</h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Número:</span> MGU-{invoice.invoice_number}</p>
                  <p><span className="font-medium">Data:</span> {format(new Date(invoice.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  <p><span className="font-medium">Cliente ID:</span> {invoice.customer_id || invoice.client_id}</p>
                  <p><span className="font-medium">Mecânico:</span> {invoice.mechanic_name}</p>
                  <p><span className="font-medium">Local:</span> {invoice.location === 'external' ? 'Atendimento Externo' : 'Oficina'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
              Informações do Cliente
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              {invoice.clientData && invoice.clientData.type !== 'unregistered' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Nome Completo:</span>
                    <p className="text-gray-900 font-medium">{invoice.clientData.full_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Email:</span>
                    <p className="text-gray-900">{invoice.clientData.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Telefone:</span>
                    <p className="text-gray-900">{invoice.clientData.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm font-medium">Tipo:</span>
                    <p className="text-gray-900 font-medium">
                      {invoice.clientData.type === 'registered_client' ? 'Cliente Registrado' :
                       invoice.clientData.type === 'registered_mechanic' ? 'Mecânico' : 'Cliente'}
                    </p>
                  </div>
                  {invoice.clientData.address && (
                    <div className="col-span-2">
                      <span className="text-gray-600 text-sm font-medium">Endereço:</span>
                      <p className="text-gray-900">{invoice.clientData.address}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600">Cliente ID: <span className="font-medium text-gray-900">{invoice.customer_id || invoice.client_id}</span></p>
                  <p className="text-gray-500 text-sm">Cliente não registrado no sistema</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
              Detalhamento dos Serviços
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 font-medium text-gray-700">Serviço</th>
                    <th className="text-center p-3 font-medium text-gray-700">Local</th>
                    <th className="text-center p-3 font-medium text-gray-700">Qtd</th>
                    <th className="text-right p-3 font-medium text-gray-700">Valor Unit.</th>
                    <th className="text-right p-3 font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.services?.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="border border-gray-300 p-3">
                        <div>
                          <p className="font-medium">{item.service?.name || 'Serviço'}</p>
                          {item.service?.description && (
                            <p className="text-sm text-gray-600">{item.service.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 text-center p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.is_external 
                            ? 'bg-orange-100 text-orange-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {item.is_external ? 'Externo' : 'Interno'}
                        </span>
                      </td>
                      <td className="border border-gray-300 text-center p-3 font-medium">{item.quantity}</td>
                      <td className="border border-gray-300 text-right p-3">
                        ${(item.subtotal / item.quantity).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 text-right p-3 font-bold">
                        ${item.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Extra Parts */}
          {(invoice.order_data?.extra_parts?.length > 0 || invoice.parts_extra_value > 0) && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                Peças Adicionais
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                {invoice.order_data?.extra_parts?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 text-left p-3 font-medium text-gray-700">Peça</th>
                          <th className="border border-gray-300 text-center p-3 font-medium text-gray-700">Qtd</th>
                          <th className="border border-gray-300 text-right p-3 font-medium text-gray-700">Valor Unit.</th>
                          <th className="border border-gray-300 text-right p-3 font-medium text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.order_data.extra_parts.map((part: any, index: number) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="border border-gray-300 p-3 font-medium">{part.name}</td>
                            <td className="border border-gray-300 text-center p-3">{part.quantity}</td>
                            <td className="border border-gray-300 text-right p-3">${part.price.toLocaleString()}</td>
                            <td className="border border-gray-300 text-right p-3 font-bold">
                              ${(part.price * part.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-700 font-medium">Valor total de peças extras: ${invoice.parts_extra_value?.toLocaleString() || '0'}</p>
                    <p className="text-gray-600 text-sm">Detalhamento não especificado</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
                <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">Resumo Financeiro</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal Serviços:</span>
                    <span className="font-medium">${invoice.totals.servicesSubtotal.toLocaleString()}</span>
                  </div>
                  {invoice.totals.partsSubtotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal Peças:</span>
                      <span className="font-medium">${invoice.totals.partsSubtotal.toLocaleString()}</span>
                    </div>
                  )}
                  {invoice.totals.partsTax > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Taxa de Peças ({invoice.parts_fee_pct || 0}%):</span>
                      <span className="font-medium">${invoice.totals.partsTax.toLocaleString()}</span>
                    </div>
                  )}
                  {invoice.totals.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span className="font-medium">-${invoice.totals.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-gray-400 pt-3 mt-3">
                    <div className="flex justify-between font-bold text-xl">
                      <span>Total Geral:</span>
                      <span className="text-red-600">${invoice.totals.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mt-8 bg-blue-50 p-4 rounded-lg">
            <h4 className="text-lg font-bold text-blue-900 mb-2">Informações de Pagamento</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-800"><strong>Formas de Pagamento:</strong></p>
                <p className="text-blue-700">• Dinheiro</p>
                <p className="text-blue-700">• PIX: mecanica@guaianases.com</p>
                <p className="text-blue-700">• Cartão (débito/crédito)</p>
              </div>
              <div>
                <p className="text-blue-800"><strong>Garantia:</strong></p>
                <p className="text-blue-700">• Serviços: 30 dias</p>
                <p className="text-blue-700">• Peças: Conforme fabricante</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-300 text-center text-gray-600 text-sm">
            <div className="mb-4">
              <p className="text-lg font-bold text-gray-800 mb-2">Obrigado pela preferência!</p>
              <p className="text-gray-700">MECÂNICA GUAIANASES - A oficina de confiança de GuaianaseRP</p>
              <p className="text-gray-600">Qualidade, confiança e tradição desde sempre</p>
            </div>
            
            <div className="border-t border-gray-300 pt-4 mt-4">
              <p className="text-gray-500">
                Esta nota fiscal foi gerada eletronicamente e é válida sem assinatura
              </p>
            </div>
            
            <p className="mt-4 text-xs">
              Nota fiscal gerada automaticamente em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InvoiceGenerator;