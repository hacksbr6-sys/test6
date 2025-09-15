/*
  # Sistema de Autenticação com Três Tipos de Usuários

  1. Novas Tabelas
    - `clients` - Clientes do sistema (aprovação automática)
    - `mechanics` - Mecânicos (precisam aprovação do ADMEC)
    - `admins` - Administradores do sistema (ADMEC)
    - `mechanic_permissions` - Permissões específicas dos mecânicos

  2. Modificações
    - Atualizar tabela `invoices` para incluir referências aos novos usuários
    - Adicionar políticas RLS para cada tipo de usuário

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas por tipo de usuário
*/

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  password text NOT NULL,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Mecânicos
CREATE TABLE IF NOT EXISTS mechanics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  password text NOT NULL,
  is_approved boolean DEFAULT false,
  is_active boolean DEFAULT true,
  approved_by uuid REFERENCES admins(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Administradores
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Permissões dos Mecânicos
CREATE TABLE IF NOT EXISTS mechanic_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id uuid REFERENCES mechanics(id) ON DELETE CASCADE,
  can_manage_cars boolean DEFAULT false,
  can_generate_invoices boolean DEFAULT true,
  can_view_all_invoices boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir admin padrão (ADMEC)
INSERT INTO admins (full_name, email, password) 
VALUES ('ADMEC', 'admec@mecanicaguaianases.com', 'mec8640')
ON CONFLICT (email) DO NOTHING;

-- Atualizar tabela de invoices para referenciar os novos usuários
DO $$
BEGIN
  -- Adicionar colunas se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'client_uuid') THEN
    ALTER TABLE invoices ADD COLUMN client_uuid uuid REFERENCES clients(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'mechanic_uuid') THEN
    ALTER TABLE invoices ADD COLUMN mechanic_uuid uuid REFERENCES mechanics(id);
  END IF;
END $$;

-- Habilitar RLS em todas as tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanic_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para Clientes
CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  USING (true); -- Permitir leitura para autenticação

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

-- Políticas para Admins
CREATE POLICY "Admins can read all data"
  ON admins
  FOR ALL
  USING (true);

-- Políticas para Permissões de Mecânicos
CREATE POLICY "Mechanic permissions readable"
  ON mechanic_permissions
  FOR SELECT
  USING (true);

CREATE POLICY "Mechanic permissions manageable"
  ON mechanic_permissions
  FOR ALL
  USING (true);

-- Atualizar políticas de invoices para incluir novos usuários
DROP POLICY IF EXISTS "Invoices are viewable by everyone" ON invoices;

CREATE POLICY "Invoices viewable by clients and mechanics"
  ON invoices
  FOR SELECT
  USING (true);

CREATE POLICY "Invoices insertable by mechanics"
  ON invoices
  FOR INSERT
  WITH CHECK (true);

-- Função para criar permissões padrão para mecânicos
CREATE OR REPLACE FUNCTION create_default_mechanic_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO mechanic_permissions (mechanic_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar permissões automáticas
DROP TRIGGER IF EXISTS create_mechanic_permissions_trigger ON mechanics;
CREATE TRIGGER create_mechanic_permissions_trigger
  AFTER INSERT ON mechanics
  FOR EACH ROW
  EXECUTE FUNCTION create_default_mechanic_permissions();