import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholder values if environment variables are not set
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

export const supabase = createClient(
  supabaseUrl || defaultUrl, 
  supabaseAnonKey || defaultKey
);

// Admin authentication
export const adminLogin = async (username: string, password: string) => {
  // Admin credentials
  if ((username === 'ADMEC' || username === 'admec@mecanicaguaianases.com') && password === 'mec8640') {
    return { success: true, role: 'admin', username: 'ADMEC' };
  }
  // Mechanic credentials
  if (username === 'Mec1' && password === 'gua1') {
    return { success: true, role: 'mechanic', username: 'Mec1' };
  }
  return { success: false, error: 'Credenciais inválidas' };
};

export const isAdminLoggedIn = () => {
  return localStorage.getItem('admin_logged_in') === 'true';
};

export const isMechanicLoggedIn = () => {
  return localStorage.getItem('mechanic_logged_in') === 'true';
};

export const isAnyUserLoggedIn = () => {
  return isAdminLoggedIn() || isMechanicLoggedIn();
};

export const getCurrentUserRole = () => {
  if (isAdminLoggedIn()) return 'admin';
  if (isMechanicLoggedIn()) return 'mechanic';
  return null;
};

export const getCurrentUsername = () => {
  return localStorage.getItem('current_username') || null;
};

export const setAdminLogin = (loggedIn: boolean, role?: string, username?: string) => {
  if (loggedIn) {
    if (role === 'admin') {
      localStorage.setItem('admin_logged_in', 'true');
      localStorage.removeItem('mechanic_logged_in');
    } else if (role === 'mechanic') {
      localStorage.setItem('mechanic_logged_in', 'true');
      localStorage.removeItem('admin_logged_in');
    }
    if (username) {
      localStorage.setItem('current_username', username);
    }
  } else {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('mechanic_logged_in');
    localStorage.removeItem('current_username');
  }
};