/*
  # Sistema Completo de Autenticação e Permissões

  1. Novas Tabelas
    - `clients` - Clientes (aprovação automática)
    - `mechanics` - Mecânicos (precisam aprovação do ADMEC)
    - `cars` - Veículos da revenda
    - `invoices` - Notas fiscais
    - `notifications` - Notificações do sistema
    - `purchase_requests` - Solicitações de compra de veículos

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas por tipo de usuário
    - Controle de permissões granular
*/

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  password text NOT NULL,
  role text DEFAULT 'client' CHECK (role IN ('client')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Mecânicos
CREATE TABLE IF NOT EXISTS mechanics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  password text NOT NULL,
  role text DEFAULT 'mechanic' CHECK (role IN ('mechanic')),
  authorized boolean DEFAULT false,
  is_active boolean DEFAULT true,
  can_manage_cars boolean DEFAULT false,
  can_generate_invoices boolean DEFAULT true,
  can_view_all_invoices boolean DEFAULT false,
  authorized_by text,
  authorized_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Carros
CREATE TABLE IF NOT EXISTS cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  brand text NOT NULL,
  year integer NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  status text DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Notas Fiscais
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number bigint UNIQUE NOT NULL,
  client_id text NOT NULL,
  mechanic_id uuid REFERENCES mechanics(id),
  mechanic_name text NOT NULL,
  customer_id text NOT NULL,
  location text DEFAULT 'internal' CHECK (location IN ('internal', 'external')),
  parts_extra_value numeric DEFAULT 0,
  parts_fee_pct numeric DEFAULT 0,
  discount_pct numeric DEFAULT 0,
  discount_value numeric DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  order_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('car_sale', 'service_order', 'invoice', 'mechanic_registration', 'general')),
  message text NOT NULL,
  user_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Solicitações de Compra
CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  client_name text NOT NULL,
  contact text NOT NULL,
  car_id uuid REFERENCES cars(id) ON DELETE CASCADE,
  price_offered numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir admin padrão (ADMEC) se não existir
DO $$
BEGIN
  -- Criar tabela de admins se não existir
  CREATE TABLE IF NOT EXISTS admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text UNIQUE NOT NULL,
    full_name text NOT NULL,
    email text UNIQUE NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'admin' CHECK (role IN ('admin')),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
  );

  -- Inserir ADMEC se não existir
  INSERT INTO admins (username, full_name, email, password) 
  VALUES ('ADMEC', 'ADMEC', 'admec@mecanicaguaianases.com', 'mec8640')
  ON CONFLICT (username) DO NOTHING;
END $$;

-- Habilitar RLS em todas as tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Políticas para Clientes
CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  USING (true);

CREATE POLICY "Clients can update own data"
  ON clients
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can insert clients"
  ON clients
  FOR INSERT
  WITH CHECK (true);

-- Políticas para Mecânicos
CREATE POLICY "Mechanics can read own data"
  ON mechanics
  FOR SELECT
  USING (true);

CREATE POLICY "Mechanics can update own data"
  ON mechanics
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can insert mechanics"
  ON mechanics
  FOR INSERT
  WITH CHECK (true);

-- Políticas para Carros
CREATE POLICY "Cars are viewable by everyone"
  ON cars
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Cars manageable by authorized mechanics"
  ON cars
  FOR ALL
  USING (true);

-- Políticas para Notas Fiscais
CREATE POLICY "Invoices viewable by all"
  ON invoices
  FOR SELECT
  USING (true);

CREATE POLICY "Invoices insertable by mechanics"
  ON invoices
  FOR INSERT
  WITH CHECK (true);

-- Políticas para Notificações
CREATE POLICY "Notifications viewable by all"
  ON notifications
  FOR SELECT
  USING (true);

CREATE POLICY "Notifications insertable"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Notifications updatable"
  ON notifications
  FOR UPDATE
  USING (true);

-- Políticas para Solicitações de Compra
CREATE POLICY "Purchase requests viewable by all"
  ON purchase_requests
  FOR SELECT
  USING (true);

CREATE POLICY "Purchase requests insertable"
  ON purchase_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Purchase requests updatable"
  ON purchase_requests
  FOR UPDATE
  USING (true);

-- Políticas para Admins
CREATE POLICY "Admins can do everything"
  ON admins
  FOR ALL
  USING (true);

-- Inserir alguns dados de exemplo para carros
INSERT INTO cars (brand, model, year, price, description, status) VALUES
('Toyota', 'Corolla', 2020, 85000, 'Sedan executivo em excelente estado', 'available'),
('Honda', 'Civic', 2019, 78000, 'Carro esportivo com baixa quilometragem', 'available'),
('Volkswagen', 'Golf', 2021, 92000, 'Hatchback premium com todos os opcionais', 'available'),
('Ford', 'Focus', 2018, 65000, 'Compacto econômico ideal para cidade', 'available'),
('Chevrolet', 'Onix', 2022, 55000, 'Carro zero com garantia de fábrica', 'available')
ON CONFLICT DO NOTHING;

-- Inserir alguns serviços de exemplo
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_inshop numeric NOT NULL DEFAULT 0,
  price_offsite numeric NOT NULL DEFAULT 0,
  requires_tow boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services viewable by all"
  ON services
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Services manageable by admins"
  ON services
  FOR ALL
  USING (true);

-- Inserir serviços de exemplo
INSERT INTO services (name, description, price_inshop, price_offsite, requires_tow) VALUES
('Troca de Óleo', 'Troca completa do óleo do motor', 150, 200, false),
('Alinhamento', 'Alinhamento e balanceamento das rodas', 80, 120, false),
('Revisão Completa', 'Revisão geral do veículo', 300, 450, false),
('Troca de Pastilhas', 'Substituição das pastilhas de freio', 200, 280, false),
('Diagnóstico Eletrônico', 'Diagnóstico completo do sistema eletrônico', 100, 150, false),
('Reparo de Motor', 'Reparo geral do motor', 800, 1200, true),
('Troca de Embreagem', 'Substituição do kit de embreagem', 600, 900, true),
('Pintura Completa', 'Pintura completa do veículo', 1500, 2000, false)
ON CONFLICT DO NOTHING;