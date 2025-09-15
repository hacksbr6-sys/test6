import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Calculator, FileText } from 'lucide-react';
import { getCurrentUser, hasPermission } from '../lib/auth';
import ServiceCalculator from '../components/ServiceCalculator';

const Workshop: React.FC = () => {
  const currentUser = getCurrentUser();
  const canAccessWorkshop = hasPermission('access_workshop');

  if (!canAccessWorkshop) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Acesso Restrito</h2>
          <p className="text-gray-400 mb-6">
            Apenas mecânicos aprovados podem acessar a oficina.
          </p>
          {!currentUser && (
            <p className="text-gray-500">
              Faça login como mecânico para continuar.
            </p>
          )}
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
            <span className="text-red-600">OFICINA</span> GUAIANASES
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Calcule o valor dos seus serviços e gere notas fiscais profissionais
          </p>
        </motion.div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/50 rounded-xl p-6 border border-gray-800 text-center"
          >
            <div className="text-red-600 mb-4">
              <Wrench className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Serviços Completos</h3>
            <p className="text-gray-400">
              Todos os serviços disponíveis com preços diferenciados para atendimento interno e externo
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/50 rounded-xl p-6 border border-gray-800 text-center"
          >
            <div className="text-red-600 mb-4">
              <Calculator className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Calculadora Avançada</h3>
            <p className="text-gray-400">
              Calcule preços com peças extras, taxas e descontos de forma automática
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/50 rounded-xl p-6 border border-gray-800 text-center"
          >
            <div className="text-red-600 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Notas Fiscais</h3>
            <p className="text-gray-400">
              Gere e imprima notas fiscais profissionais para todos os seus atendimentos
            </p>
          </motion.div>
        </div>

        {/* Service Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ServiceCalculator />
        </motion.div>
      </div>
    </div>
  );
};

export default Workshop;