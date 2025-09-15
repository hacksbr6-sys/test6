import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price_inshop: number;
  price_offsite: number;
  requires_tow: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: number;
  client_id: string;
  mechanic_name: string;
  customer_id: string;
  total: number;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

export interface Mechanic {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  position: string;
  approved: boolean;
  can_generate_invoices: boolean;
  can_view_all_invoices: boolean;
  can_manage_cars: boolean;
  can_sell_cars: boolean;
  can_post_cars: boolean;
  can_manage_mechanics: boolean;
  created_at: string;
}

export interface PurchaseRequest {
  id: string;
  client_id: string;
  client_name: string;
  contact: string;
  car_id: string;
  price_offered: number;
  status: string;
  created_at: string;
  cars?: Car;
}

// Hook para carros
export const useCars = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = async () => {
    console.log('[useCars] Buscando carros...');
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useCars] Erro ao buscar carros:', error);
        setError(error.message);
        setCars([]);
      } else {
        console.log('[useCars] Carros carregados:', data?.length || 0);
        setCars(data || []);
      }
    } catch (error: any) {
      console.error('[useCars] Erro inesperado:', error);
      setError('Erro inesperado ao carregar carros');
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  return { cars, loading, error, refetch: fetchCars };
};

// Hook para serviços
export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    console.log('[useServices] Buscando serviços...');
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('[useServices] Erro ao buscar serviços:', error);
        setError(error.message);
        setServices([]);
      } else {
        console.log('[useServices] Serviços carregados:', data?.length || 0);
        setServices(data || []);
      }
    } catch (error: any) {
      console.error('[useServices] Erro inesperado:', error);
      setError('Erro inesperado ao carregar serviços');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return { services, loading, error, refetch: fetchServices };
};

// Hook para notificações
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    console.log('[useNotifications] Buscando notificações...');
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useNotifications] Erro ao buscar notificações:', error);
        setError(error.message);
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.log('[useNotifications] Notificações carregadas:', data?.length || 0);
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.is_read).length || 0);
      }
    } catch (error: any) {
      console.error('[useNotifications] Erro inesperado:', error);
      setError('Erro inesperado ao carregar notificações');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return { notifications, unreadCount, loading, error, refetch: fetchNotifications };
};

// Hook para clientes (admin)
export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    console.log('[useClients] Buscando clientes...');
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useClients] Erro ao buscar clientes:', error);
        setError(error.message);
        setClients([]);
      } else {
        console.log('[useClients] Clientes carregados:', data?.length || 0);
        setClients(data || []);
      }
    } catch (error: any) {
      console.error('[useClients] Erro inesperado:', error);
      setError('Erro inesperado ao carregar clientes');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return { clients, loading, error, refetch: fetchClients };
};

// Hook para mecânicos (admin)
export const useMechanics = () => {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMechanics = async () => {
    console.log('[useMechanics] Buscando mecânicos...');
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('mechanics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useMechanics] Erro ao buscar mecânicos:', error);
        setError(error.message);
        setMechanics([]);
      } else {
        console.log('[useMechanics] Mecânicos carregados:', data?.length || 0);
        setMechanics(data || []);
      }
    } catch (error: any) {
      console.error('[useMechanics] Erro inesperado:', error);
      setError('Erro inesperado ao carregar mecânicos');
      setMechanics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanics();
  }, []);

  return { mechanics, loading, error, refetch: fetchMechanics };
};

// Hook para notas fiscais
export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    console.log('[useInvoices] Buscando notas fiscais...');
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useInvoices] Erro ao buscar notas fiscais:', error);
        setError(error.message);
        setInvoices([]);
      } else {
        console.log('[useInvoices] Notas fiscais carregadas:', data?.length || 0);
        setInvoices(data || []);
      }
    } catch (error: any) {
      console.error('[useInvoices] Erro inesperado:', error);
      setError('Erro inesperado ao carregar notas fiscais');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return { invoices, loading, error, refetch: fetchInvoices };
};

// Hook para solicitações de compra
export const usePurchaseRequests = () => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    console.log('[usePurchaseRequests] Buscando solicitações de compra...');
    setLoading(true);
    setError(null);
    
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[usePurchaseRequests] Erro ao buscar solicitações:', error);
        setError(error.message);
        setRequests([]);
      } else {
        console.log('[usePurchaseRequests] Solicitações carregadas:', data?.length || 0);
        setRequests(data || []);
      }
    } catch (error: any) {
      console.error('[usePurchaseRequests] Erro inesperado:', error);
      setError('Erro inesperado ao carregar solicitações');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return { requests, loading, error, refetch: fetchRequests };
};