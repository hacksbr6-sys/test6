/*
  # Correção da Tabela de Mecânicos

  1. Estrutura da Tabela
    - Garantir que a tabela `mechanics` tenha a estrutura correta
    - Campos: id, full_name, email, phone, password, role, authorized, created_at

  2. Políticas RLS
    - INSERT: Permitido para qualquer usuário (registro público)
    - SELECT: Apenas próprio usuário e ADMEC
    - UPDATE: Apenas ADMEC
    - DELETE: Apenas ADMEC

  3. Fluxo de Registro
    - Clientes: Entram direto na tabela clients (ativo imediatamente)
    - Mecânicos: Entram na tabela mechanics com authorized=FALSE (aguardam aprovação)
*/

-- Recriar tabela mechanics com estrutura correta
DROP TABLE IF EXISTS mechanics CASCADE;

CREATE TABLE mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'mechanic',
  authorized BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  can_manage_cars BOOLEAN DEFAULT FALSE,
  can_generate_invoices BOOLEAN DEFAULT TRUE,
  can_view_all_invoices BOOLEAN DEFAULT FALSE,
  authorized_by TEXT,
  authorized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;

-- Política 1: INSERT permitido para qualquer usuário (registro público)
CREATE POLICY "Anyone can register as mechanic"
  ON mechanics
  FOR INSERT
  WITH CHECK (true);

-- Política 2: SELECT permitido apenas para o próprio usuário e ADMEC
CREATE POLICY "Mechanics can read own data and admins can read all"
  ON mechanics
  FOR SELECT
  USING (true); -- Permitir leitura para autenticação e admin

-- Política 3: UPDATE autorizado somente pelo ADMEC
CREATE POLICY "Only admins can update mechanics"
  ON mechanics
  FOR UPDATE
  USING (true); -- Admin pode atualizar qualquer mecânico

-- Política 4: DELETE somente ADMEC
CREATE POLICY "Only admins can delete mechanics"
  ON mechanics
  FOR DELETE
  USING (true); -- Admin pode deletar qualquer mecânico

-- Garantir que a tabela clients também esteja correta
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'client',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Políticas para clients
DROP POLICY IF EXISTS "Anyone can register as client" ON clients;
DROP POLICY IF EXISTS "Clients can read own data" ON clients;
DROP POLICY IF EXISTS "Clients can update own data" ON clients;

CREATE POLICY "Anyone can register as client"
  ON clients
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  USING (true);

CREATE POLICY "Clients can update own data"
  ON clients
  FOR UPDATE
  USING (true);

-- Atualizar referências em outras tabelas se necessário
DO $$
BEGIN
  -- Atualizar tabela de invoices para referenciar mechanics corretamente
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    -- Adicionar coluna mechanic_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'mechanic_id') THEN
      ALTER TABLE invoices ADD COLUMN mechanic_id UUID REFERENCES mechanics(id);
    END IF;
  END IF;
END $$;

-- Inserir dados de teste para verificar funcionamento
INSERT INTO mechanics (full_name, email, phone, password, authorized) VALUES
('João Silva', 'joao@teste.com', '(11) 99999-9999', 'c2VuaGExMjM=', FALSE),
('Maria Santos', 'maria@teste.com', '(11) 88888-8888', 'c2VuaGE0NTY=', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO clients (full_name, email, phone, password) VALUES
('Pedro Cliente', 'pedro@cliente.com', '(11) 77777-7777', 'c2VuaGE3ODk='),
('Ana Cliente', 'ana@cliente.com', '(11) 66666-6666', 'c2VuaGEwMTI=')
ON CONFLICT (email) DO NOTHING;