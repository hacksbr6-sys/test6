import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  type: 'client' | 'mechanic' | 'admin';
  position?: string;
  permissions?: {
    can_manage_cars: boolean;
    can_generate_invoices: boolean;
    can_view_all_invoices: boolean;
    can_sell_cars: boolean;
    can_post_cars: boolean;
    can_manage_mechanics: boolean;
  };
  approved?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterClientData {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
}

export interface RegisterMechanicData {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
}

// Função para hash de senha simples (em produção, use bcrypt)
const hashPassword = (password: string): string => {
  return btoa(password); // Base64 encoding - substitua por hash real em produção
};

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return btoa(password) === hashedPassword;
};

// Debug logging
const debugLog = (message: string, data?: any) => {
  console.log(`[AUTH] ${message}`, data || '');
};

// Registro de Cliente (aprovação automática)
export const registerClient = async (data: RegisterClientData): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
  debugLog('Iniciando registro de cliente', { email: data.email });
  
  try {
    // Verificar se email já existe
    const { data: existingClient } = await supabase
      .from('clients')
      .select('email')
      .eq('email', data.email)
      .single();

    if (existingClient) {
      debugLog('Email já existe na tabela clients');
      return { success: false, error: 'Email já está em uso' };
    }

    // Verificar se email existe em mechanics
    const { data: existingMechanic } = await supabase
      .from('mechanics')
      .select('email')
      .eq('email', data.email)
      .single();

    if (existingMechanic) {
      debugLog('Email já existe na tabela mechanics');
      return { success: false, error: 'Email já está em uso' };
    }

    // Criar cliente
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert([{
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        password: hashPassword(data.password)
      }])
      .select()
      .single();

    if (error) {
      debugLog('Erro ao inserir cliente', error);
      throw error;
    }

    debugLog('Cliente registrado com sucesso', { id: newClient.id });

    const user: AuthUser = {
      id: newClient.id,
      full_name: newClient.full_name,
      email: newClient.email,
      type: 'client'
    };

    return { success: true, user };
  } catch (error: any) {
    debugLog('Erro no registro de cliente', error);
    return { success: false, error: error.message || 'Erro ao registrar cliente' };
  }
};

// Registro de Mecânico (precisa aprovação do ADMEC)
export const registerMechanic = async (data: RegisterMechanicData): Promise<{ success: boolean; error?: string; message?: string }> => {
  debugLog('Iniciando registro de mecânico', { email: data.email });
  
  try {
    // Verificar se email já existe
    const { data: existingMechanic } = await supabase
      .from('mechanics')
      .select('email')
      .eq('email', data.email)
      .single();

    if (existingMechanic) {
      debugLog('Email já existe na tabela mechanics');
      return { success: false, error: 'Email já está em uso' };
    }

    // Verificar se email existe em clients
    const { data: existingClient } = await supabase
      .from('clients')
      .select('email')
      .eq('email', data.email)
      .single();

    if (existingClient) {
      debugLog('Email já existe na tabela clients');
      return { success: false, error: 'Email já está em uso' };
    }

    // Criar mecânico (não aprovado)
    const { error } = await supabase
      .from('mechanics')
      .insert([{
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        password: hashPassword(data.password),
        approved: false
      }]);

    if (error) {
      debugLog('Erro ao inserir mecânico', error);
      throw error;
    }

    debugLog('Mecânico registrado, aguardando aprovação do ADMEC');

    // Criar notificação para admin
    await supabase
      .from('notifications')
      .insert({
        type: 'mechanic_registration',
        message: `Novo mecânico solicitou registro: ${data.full_name} (${data.email})`,
        is_read: false
      });

    return { 
      success: true, 
      message: 'Registro enviado! Aguarde aprovação do ADMEC para fazer login.' 
    };
  } catch (error: any) {
    debugLog('Erro no registro de mecânico', error);
    return { success: false, error: error.message || 'Erro ao registrar mecânico' };
  }
};

// Login
export const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
  debugLog('Tentativa de login', { email: credentials.email });
  
  try {
    // Admin login para ADMEC
    if ((credentials.email === 'ADMEC' || credentials.email === 'admec@mecanicaguaianases.com') && credentials.password === 'mec8640') {
      debugLog('Login de admin ADMEC');
      const user: AuthUser = {
        id: 'admin-1',
        full_name: 'ADMEC',
        email: 'admec@mecanicaguaianases.com',
        type: 'admin'
      };
      return { success: true, user };
    }

    // Tentar login como cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('email', credentials.email)
      .maybeSingle();

    if (client && verifyPassword(credentials.password, client.password)) {
      debugLog('Login de cliente bem-sucedido', { id: client.id });
      const user: AuthUser = {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        type: 'client'
      };
      return { success: true, user };
    }

    // Tentar login como mecânico
    const { data: mechanic, error: mechanicError } = await supabase
      .from('mechanics')
      .select('*')
      .eq('email', credentials.email)
      .maybeSingle();

    if (mechanic) {
      if (verifyPassword(credentials.password, mechanic.password)) {
        // Verificar se mecânico está aprovado
        if (!mechanic.approved) {
          'sell_cars', 
          'manage_purchase_requests',
          'manage_cars',
          'Ver notificações do sistema',
          'Adicionar/remover carros',
          'Gerenciar estoque de veículos'
        }
        
        debugLog('Login de mecânico bem-sucedido', { id: mechanic.id });
        const user: AuthUser = {
          id: mechanic.id,
          full_name: mechanic.full_name,
          email: mechanic.email,
          type: 'mechanic',
          position: mechanic.position,
          approved: mechanic.approved,
          permissions: {
            can_manage_cars: false,
            can_generate_invoices: true,
            can_view_all_invoices: mechanic.can_view_all_invoices || false,
            can_sell_cars: mechanic.can_sell_cars || false,
            can_post_cars: mechanic.can_post_cars || false,
            can_manage_mechanics: mechanic.can_manage_mechanics || false
          }
        };
        return { success: true, user };
      }
    }

    debugLog('Credenciais inválidas');
    return { success: false, error: 'Email ou senha incorretos' };
  } catch (error: any) {
    debugLog('Erro durante login', error);
    return { success: false, error: error.message || 'Erro ao fazer login' };
  }
};

// Gerenciamento de sessão
export const getCurrentUser = (): AuthUser | null => {
  const userData = localStorage.getItem('current_user');
  return userData ? JSON.parse(userData) : null;
};

export const setCurrentUser = (user: AuthUser | null) => {
  if (user) {
    debugLog('Definindo usuário atual', { id: user.id, type: user.type });
    localStorage.setItem('current_user', JSON.stringify(user));
  } else {
    debugLog('Removendo usuário atual');
    localStorage.removeItem('current_user');
  }
};

export const logout = () => {
  debugLog('Fazendo logout');
  localStorage.removeItem('current_user');
  // Limpar também dados do sistema antigo
  localStorage.removeItem('admin_logged_in');
  localStorage.removeItem('mechanic_logged_in');
  localStorage.removeItem('current_username');
};

export const isLoggedIn = (): boolean => {
  return getCurrentUser() !== null;
};

// Sistema de permissões
export const hasPermission = (permission: string): boolean => {
  const user = getCurrentUser();
  if (!user) {
    debugLog('Verificação de permissão sem usuário logado', { permission });
    return false;
  }
  
  debugLog('Verificando permissão', { permission, userType: user.type });
  
  // Admin tem todas as permissões
  if (user.type === 'admin') return true;
  
  // Permissões específicas por tipo de usuário
  switch (user.type) {
    case 'client':
      return [
        'view_cars',
        'buy_cars',
        'request_car_purchase',
        'view_own_invoices'
      ].includes(permission);
      
    case 'mechanic':
      if (!user.approved) return false;
      
      // Permissões baseadas no cargo
      const position = user.position || 'colaborador';
      
      switch (position) {
        case 'colaborador':
          return [
            'view_cars',
            'buy_cars',
            'request_car_purchase',
            'generate_invoices',
            'access_workshop'
          ].includes(permission);
          
        case 'encarregado':
          return [
            'view_cars',
            'buy_cars',
            'request_car_purchase',
            'generate_invoices',
            'access_workshop',
            'sell_cars',
            'manage_purchase_requests'
          ].includes(permission);
          
        case 'gerente':
          return [
            'view_cars',
            'buy_cars',
            'request_car_purchase',
            'generate_invoices',
            'access_workshop',
            'sell_cars',
            'manage_purchase_requests',
            'view_all_invoices'
          ].includes(permission);
          
        case 'sub_regional':
        case 'regional':
          return [
            'view_cars',
            'buy_cars',
            'request_car_purchase',
            'generate_invoices',
            'access_workshop',
            'sell_cars',
            'manage_purchase_requests',
            'view_all_invoices',
            'manage_cars',
            'post_cars',
            'delete_invoices',
            'manage_mechanics'
          ].includes(permission);
          
        default:
          return ['view_cars', 'buy_cars', 'request_car_purchase'].includes(permission);
      }
      
    default:
      return false;
  }
};

// Verificações de acesso a rotas
export const canAccessRoute = (route: string): boolean => {
  const user = getCurrentUser();
  
  debugLog('Verificando acesso à rota', { route, user: user?.type });
  
  if (!user) {
    // Rotas públicas
    return ['/', '/cars', '/invoices', '/login', '/register/client', '/register/mechanic'].includes(route);
  }
  
  switch (user.type) {
    case 'client':
      // Clientes têm acesso completo às rotas públicas
      return ['/', '/cars', '/invoices'].includes(route);
      
    case 'mechanic':
      // Mecânicos não aprovados só podem acessar a página inicial
      if (!user.approved) return route === '/';
      
      const position = user.position || 'colaborador';
      const baseRoutes = ['/', '/cars', '/workshop', '/invoices'];
      
      // Todos os mecânicos aprovados podem acessar as rotas base
      if (baseRoutes.includes(route)) return true;
      
      // Rota admin baseada no cargo
      if (route === '/admin') {
        return ['encarregado', 'gerente', 'sub_regional', 'regional'].includes(position);
      }
      
      // Rota manager específica para gerentes
      if (route === '/manager') {
        return position === 'gerente';
      }
      
      // Rota supervisor específica para encarregados
      if (route === '/supervisor') {
        return position === 'encarregado';
      }
      
      // Rota regional específica para regionais
      if (route === '/regional') {
        return position === 'regional';
      }
      
      // Rota subregional específica para sub regionais
      if (route === '/subregional') {
        return position === 'sub_regional';
      }
      
      return false;
      
    case 'admin':
      return true; // Admin pode acessar qualquer rota
      
    default:
      return false;
  }
};

// Redirecionamento baseado no tipo de usuário
export const getDefaultRoute = (userType: string): string => {
  switch (userType) {
    case 'client':
      return '/';
    case 'mechanic':
      return '/';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
};

// Verificar se usuário pode acessar painel admin
export const canAccessAdmin = (): boolean => {
  const user = getCurrentUser();
  if (user?.type === 'admin') return true;
  
  // Encarregado e acima podem acessar painel admin
  if (user?.type === 'mechanic' && user?.approved) {
    const position = user.position || 'colaborador';
    return ['encarregado', 'gerente', 'sub_regional', 'regional'].includes(position);
  }
  
  return false;
};

// Função para obter descrição das permissões por cargo
export const getPositionPermissions = (position: string): string[] => {
  switch (position) {
    case 'colaborador':
      return [
        'Fazer serviços na oficina',
        'Gerar notas fiscais',
        'Ver carros disponíveis'
      ];
      
    case 'encarregado':
      return [
        'Fazer serviços na oficina',
        'Gerar notas fiscais',
        'Ver carros disponíveis',
        'Fazer vendas de veículos',
        'Aceitar/recusar solicitações de compra',
        'Ver notificações do sistema'
      ];
      
    case 'gerente':
      return [
        'Fazer serviços na oficina',
        'Gerar notas fiscais',
        'Ver carros disponíveis',
        'Fazer vendas de veículos',
        'Aceitar/recusar solicitações de compra',
        'Visualizar todas as notas fiscais',
        'Ver notificações do sistema',
        'Adicionar/remover carros'
      ];
      
    case 'sub_regional':
      return [
        'Acesso total ao sistema',
        'Adicionar/remover carros',
        'Gerenciar mecânicos',
        'Deletar notas fiscais',
        'Todas as funcionalidades',
        'Painel administrativo completo'
      ];
      
    case 'regional':
      return [
        'Acesso total ao sistema',
        'Adicionar/remover carros',
        'Gerenciar mecânicos',
        'Deletar notas fiscais',
        'Todas as funcionalidades',
        'Nível máximo de acesso',
        'Equivalente ao ADMEC'
      ];
      
    default:
      return ['Sem permissões especiais'];
  }
};

// Verificar permissões específicas baseadas no cargo
export const hasPositionPermission = (permission: string): boolean => {
  const user = getCurrentUser();
  if (!user || user.type !== 'mechanic' || !user.approved) return false;
  
  const position = user.position || 'colaborador';
  
  switch (permission) {
    case 'view_notifications':
      return ['encarregado', 'gerente', 'sub_regional', 'regional'].includes(position);
      
    case 'manage_cars':
      return ['gerente', 'sub_regional', 'regional'].includes(position);
      
    case 'manage_mechanics':
      return ['sub_regional', 'regional'].includes(position);
      
    case 'delete_invoices':
      return ['sub_regional', 'regional'].includes(position);
      
    case 'full_admin_access':
      return ['sub_regional', 'regional'].includes(position);
      
    default:
      return false;
  }
};