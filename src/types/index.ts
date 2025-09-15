export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  image_url: string;
  available: boolean;
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

export interface Part {
  id: string;
  name: string;
  base_price: number;
  active: boolean;
  created_at: string;
}

export interface CarPurchaseRequest {
  id: string;
  player_id: string;
  player_name: string;
  car_id: string;
  customer_id: string;
  customer_name: string;
  contact: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ServiceOrderItem {
  service_id: string;
  quantity: number;
  is_external: boolean;
  subtotal: number;
}

export interface ServiceOrder {
  id: string;
  client_id: string;
  mechanic_name: string;
  location: 'internal' | 'external';
  services: ServiceOrderItem[];
  extra_parts: { name: string; price: number; quantity: number }[];
  parts_tax_percent: number;
  discount_value: number;
  discount_percent: number;
  subtotal: number;
  total: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  mechanic_name: string;
  order_data: ServiceOrder;
  invoice_number: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: 'car_sale' | 'service_order' | 'invoice';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  created_at: string;
}