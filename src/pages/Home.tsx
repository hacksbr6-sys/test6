import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Wrench, Shield, Clock } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: <Car className="h-8 w-8" />,
      title: 'Revenda de Carros',
      description: 'Os melhores veículos da cidade com preços imperdíveis.',
    },
    {
      icon: <Wrench className="h-8 w-8" />,
      title: 'Serviços Completos',
      description: 'Manutenção, reparos e customização com qualidade garantida.',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Confiança Total',
      description: 'Anos de experiência e clientes satisfeitos em Guaianases.',
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Atendimento 24h',
      description: 'Estamos sempre prontos para te atender quando precisar.',
    },
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section 
        className="relative h-screen flex items-center justify-center bg-cover bg-center bg-black"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/Imagem do WhatsApp de 2025-09-10 à(s) 13.58.40_8d92645a.jpg')`
        }}
      >
        <div className="text-center text-white z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="text-red-600">MECÂNICA</span>
              <br />
              <span className="text-white">GUAIANASES</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              A oficina mais respeitada de <span className="text-red-400">GuaianaseRP</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/cars"
                className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg text-lg font-bold transition-all transform hover:scale-105"
              >
                Ver Carros Disponíveis
              </Link>
              <Link
                to="/workshop"
                className="border-2 border-white hover:bg-white hover:text-black px-8 py-4 rounded-lg text-lg font-bold transition-all transform hover:scale-105"
              >
                Calcular Serviços
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que escolher a Mecânica Guaianases?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Somos a oficina de confiança dos melhores players de GuaianaseRP
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-black/50 p-6 rounded-xl border border-gray-800 hover:border-red-600 transition-colors group"
              >
                <div className="text-red-600 group-hover:text-red-400 transition-colors mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Pronto para turbinar seu rolê?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Entre em contato conosco e descubra por que somos a oficina #1 de Guaianases
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/workshop"
                className="bg-black hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-bold transition-all transform hover:scale-105"
              >
                Fazer Orçamento
              </Link>
              <Link
                to="/cars"
                className="border-2 border-white hover:bg-white hover:text-red-600 px-8 py-4 rounded-lg text-lg font-bold transition-all transform hover:scale-105"
              >
                Comprar Carro
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;