import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Bell, LogOut, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentUser, logout, canAccessRoute, canAccessAdmin } from '../lib/auth';
import { useNotifications } from '../hooks/useSupabase';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { unreadCount } = useNotifications();
  
  // Define navigation items based on user type and permissions
  const getNavItems = () => {
    const baseItems = [{ path: '/', label: 'Início' }];
    
    if (!currentUser) {
      return [
        ...baseItems,
        { path: '/cars', label: 'Revenda' },
        { path: '/invoices', label: 'Notas Fiscais' }
      ];
    }
    
    switch (currentUser.type) {
      case 'client':
        return [
          ...baseItems,
          { path: '/cars', label: 'Revenda' },
          { path: '/invoices', label: 'Notas Fiscais' }
        ];
        
      case 'mechanic':
        if (!currentUser.approved) {
          return [{ path: '/', label: 'Início' }];
        }
        
        // Navegação baseada no cargo do mecânico
        const position = currentUser.position || 'colaborador';
        const mechanicItems = [
          ...baseItems,
          { path: '/cars', label: 'Revenda' },
          { path: '/workshop', label: 'Oficina' },
          { path: '/invoices', label: 'Notas Fiscais' }
        ];
        
        return mechanicItems;
        
      case 'admin':
        return [
          ...baseItems,
          { path: '/cars', label: 'Revenda' },
          { path: '/workshop', label: 'Oficina' },
          { path: '/invoices', label: 'Notas Fiscais' }
        ];
        
      default:
        return baseItems;
    }
  };
  
  const navItems = getNavItems();
  
  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload(); // Força reload para limpar estado
  };

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'client': return 'Cliente';
      case 'mechanic': 
        if (currentUser?.position) {
          const positions = {
            'colaborador': 'Colaborador',
            'encarregado': 'Encarregado',
            'gerente': 'Gerente',
            'sub_regional': 'Sub Regional',
            'regional': 'Regional'
          };
          return positions[currentUser.position as keyof typeof positions] || 'Mecânico';
        }
        return 'Mecânico';
      case 'admin': return 'Administrador';
      default: return type;
    }
  };

  const getUserStatusColor = () => {
    if (!currentUser) return 'text-gray-400';
    
    switch (currentUser.type) {
      case 'client': return 'text-blue-400';
      case 'mechanic': 
        if (!currentUser.approved) return 'text-yellow-400';
        // Different colors for different positions
        const positionColors = {
          'colaborador': 'text-blue-400',
          'encarregado': 'text-green-400',
          'gerente': 'text-purple-400',
          'sub_regional': 'text-orange-400',
          'regional': 'text-red-400'
        };
        return positionColors[currentUser.position as keyof typeof positionColors] || 'text-green-400';
      case 'admin': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Verificar se usuário pode acessar painel admin (admin ou sub_regional/regional)
  const canAccessAdminPanel = () => {
    if (!currentUser) return false;
    if (currentUser.type === 'admin') return true;
    if (currentUser.type === 'mechanic' && currentUser.approved) {
      const position = currentUser.position || 'colaborador';
      return ['encarregado', 'gerente', 'sub_regional', 'regional'].includes(position);
    }
    return false;
  };

  // Verificar se usuário pode acessar painel do gerente
  const canAccessManagerPanel = () => {
    if (!currentUser) return false;
    if (currentUser.type === 'mechanic' && currentUser.approved) {
      const position = currentUser.position || 'colaborador';
      return position === 'gerente';
    }
    return false;
  };

  // Verificar se usuário pode ver notificações (encarregado e acima)
  const canViewNotifications = () => {
    if (!currentUser) return false;
    if (currentUser.type === 'admin') return true;
    if (currentUser.type === 'mechanic' && currentUser.approved) {
      const position = currentUser.position || 'colaborador';
      return ['encarregado', 'gerente', 'sub_regional', 'regional'].includes(position);
    }
    return false;
  };

  // Verificar se usuário pode adicionar carros (gerente e acima)
  const canManageCars = () => {
    if (!currentUser) return false;
    if (currentUser.type === 'admin') return true;
    if (currentUser.type === 'mechanic' && currentUser.approved) {
      const position = currentUser.position || 'colaborador';
      return ['gerente', 'sub_regional', 'regional'].includes(position);
    }
    return false;
  };

  // Obter label do painel admin baseado no cargo
  const getAdminPanelLabel = () => {
    if (!currentUser) return 'Painel Admin';
    if (currentUser.type === 'admin') return 'Painel Admin';
    
    const position = currentUser.position || 'colaborador';
    switch (position) {
      case 'encarregado':
        return 'Notificações';
      case 'gerente':
        return 'Painel Gerencial';
      case 'sub_regional':
      case 'regional':
        return 'Painel Administrativo';
      default:
        return 'Painel';
    }
  };

  return (
    <header className="bg-black/90 backdrop-blur-sm border-b-2 border-red-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                MECÂNICA GUAIANASES
              </h1>
              <p className="text-red-400 text-xs">GuaianaseRP</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              // Verificar se o usuário pode acessar esta rota
              if (!canAccessRoute(item.path)) return null;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-red-400'
                      : 'text-white hover:text-red-400'
                  }`}
                >
                  {item.label}
                  {location.pathname === item.path && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                      layoutId="underline"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                {/* Supervisor Panel Access for Encarregados */}
                {currentUser.type === 'mechanic' && currentUser.approved && currentUser.position === 'encarregado' && (
                  <Link
                    to="/supervisor"
                    className="relative flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Bell className="h-4 w-4 text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                    <span className="text-white text-sm font-medium">
                      Painel Encarregado
                    </span>
                  </Link>
                )}
                
                {/* Manager Panel Access */}
                {canAccessManagerPanel() && (
                  <Link
                    to="/manager"
                    className="relative flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Bell className="h-4 w-4 text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                    <span className="text-white text-sm font-medium">
                      Painel Gerencial
                    </span>
                  </Link>
                )}
                
                {/* Admin Panel Access */}
                {canAccessAdminPanel() && !canAccessManagerPanel() && currentUser.position !== 'encarregado' && currentUser.position !== 'sub_regional' && currentUser.position !== 'regional' && (
                  <Link
                    to="/admin"
                    className="relative flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    {canViewNotifications() && (
                      <>
                        <Bell className="h-4 w-4 text-white" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </>
                    )}
                    {!canViewNotifications() && (
                      <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        <Bell className="h-3 w-3" />
                      </span>
                    )}
                    <span className="text-white text-sm font-medium">
                      {getAdminPanelLabel()}
                    </span>
                  </Link>
                )}
                
                {/* Regional Panel Access */}
                {currentUser.type === 'mechanic' && currentUser.approved && currentUser.position === 'regional' && (
                  <Link
                    to="/regional"
                    className="relative flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Bell className="h-4 w-4 text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                    <span className="text-white text-sm font-medium">
                      Painel Regional
                    </span>
                  </Link>
                )}
                
                {/* Sub Regional Panel Access */}
                {currentUser.type === 'mechanic' && currentUser.approved && currentUser.position === 'sub_regional' && (
                  <Link
                    to="/subregional"
                    className="relative flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Bell className="h-4 w-4 text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                    <span className="text-white text-sm font-medium">
                      Painel Sub Regional
                    </span>
                  </Link>
                )}
                
                {/* User Info */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    {currentUser.type === 'admin' ? (
                      <Shield className="h-4 w-4 text-red-400" />
                    ) : (
                      <User className="h-4 w-4 text-gray-400" />
                    )}
                    <div className="text-right">
                      <p className="text-white text-sm font-medium">
                        {currentUser.full_name}
                      </p>
                      <p className={`text-xs ${getUserStatusColor()}`}>
                        {getUserTypeLabel(currentUser.type)}
                        {currentUser.type === 'mechanic' && !currentUser.approved && ' (Aguardando Aprovação)'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
                    title="Sair"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Login
                </Link>
                <div className="flex items-center space-x-2">
                  <Link
                    to="/register/client"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Cliente
                  </Link>
                  <Link
                    to="/register/mechanic"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Mecânico
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-800">
        <div className="flex overflow-x-auto py-2 px-4 space-x-4">
          {navItems.map((item) => {
            if (!canAccessRoute(item.path)) return null;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-red-400'
                    : 'text-white hover:text-red-400'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Unapproved Mechanic Warning */}
      {currentUser?.type === 'mechanic' && !currentUser.approved && (
        <div className="bg-yellow-600 text-black px-4 py-2 text-center text-sm font-medium">
          ⚠️ Sua conta está aguardando aprovação do ADMEC. Funcionalidades limitadas até a aprovação.
        </div>
      )}

      {/* Position-based access info */}
      {currentUser?.type === 'mechanic' && currentUser.approved && (
        <div className="bg-blue-600/20 text-blue-300 px-4 py-1 text-center text-xs">
          {(() => {
            const position = currentUser.position || 'colaborador';
            switch (position) {
              case 'colaborador':
                return '👷 Colaborador - Acesso: Serviços e Notas Fiscais';
              case 'encarregado':
                return '👨‍💼 Encarregado - Acesso: Serviços, Vendas, Gestão de Carros e Notificações';
              case 'gerente':
                return '👔 Gerente - Acesso: Todas as funcionalidades + Gestão de Carros';
              case 'sub_regional':
                return '🏢 Sub Regional - Acesso Total ao Sistema';
              case 'regional':
                return '🏛️ Regional - Acesso Máximo (Nível ADMEC)';
              default:
                return `📋 ${position} - Verificar permissões`;
            }
          })()}
        </div>
      )}
    </header>
  );
};

export default Header;