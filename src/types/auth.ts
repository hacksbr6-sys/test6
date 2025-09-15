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
  authorized: boolean;
  is_active: boolean;
  authorized_by?: string;
  authorized_at?: string;
  created_at: string;
  can_manage_cars: boolean;
  can_generate_invoices: boolean;
  can_view_all_invoices: boolean;
}

export interface Admin {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface MechanicPermissions {
  id: string;
  mechanic_id: string;
  can_manage_cars: boolean;
  can_generate_invoices: boolean;
  can_view_all_invoices: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  type: 'client' | 'mechanic' | 'admin';
  permissions?: MechanicPermissions;
}

export interface LoginCredentials {
  email: string; // Para admins, este campo será usado como nome de usuário
  password: string;
}

export interface RegisterClientData {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  address?: string;
}

export interface RegisterMechanicData {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}