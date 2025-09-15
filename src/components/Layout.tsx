import React from 'react';
import { Settings } from 'lucide-react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="relative">
        {children}
      </main>
      <footer className="bg-black border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-red-600 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">MECÂNICA GUAIANASES</h3>
              <p className="text-red-400 text-sm">GuaianaseRP</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 Mecânica Guaianases. Todos os direitos reservados para Alison A H.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;