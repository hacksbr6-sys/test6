import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, canAccessRoute, getDefaultRoute } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'client' | 'mechanic' | 'admin';
  requireAuth?: boolean;
  route: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredUserType, 
  requireAuth = false,
  route 
}) => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Se requer autenticação e usuário não está logado
    if (requireAuth && !currentUser) {
      console.log('[ProtectedRoute] Usuário não autenticado, redirecionando para login');
      navigate('/login');
      return;
    }

    // Se usuário está logado mas não pode acessar esta rota
    if (currentUser && !canAccessRoute(route)) {
      console.log('[ProtectedRoute] Usuário não pode acessar rota', { 
        userType: currentUser.type, 
        route,
        authorized: currentUser.authorized 
      });
      
      // Redirecionar para rota padrão do usuário
      const defaultRoute = getDefaultRoute(currentUser.type);
      navigate(defaultRoute);
      return;
    }

    // Se requer tipo específico de usuário
    if (requiredUserType && currentUser?.type !== requiredUserType) {
      console.log('[ProtectedRoute] Tipo de usuário incorreto', { 
        required: requiredUserType, 
        actual: currentUser?.type 
      });
      
      if (currentUser) {
        const defaultRoute = getDefaultRoute(currentUser.type);
        navigate(defaultRoute);
      } else {
        navigate('/login');
      }
      return;
    }

    // Verificação especial para mecânicos não autorizados
    if (currentUser?.type === 'mechanic' && !currentUser.approved) {
      // Mecânicos não aprovados só podem acessar a página inicial
      const allowedRoutes = ['/'];
      if (!allowedRoutes.includes(route)) {
      console.log('[ProtectedRoute] Mecânico não aprovado tentando acessar rota protegida');
      navigate('/');
      return;
      }
    }

  }, [currentUser, requiredUserType, requireAuth, route, navigate]);

  // Se passou por todas as verificações, renderizar o componente
  return <>{children}</>;
};

export default ProtectedRoute;