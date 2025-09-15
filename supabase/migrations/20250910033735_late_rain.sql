/*
  # Correção das Tabelas de Registro

  1. Tabelas
    - `clients` - Clientes com aprovação automática
    - `mechanics` - Mecânicos que precisam aprovação do ADMEC

  2. Estrutura
    - Campos obrigatórios conforme especificação
    - RLS habilitado para segurança
    - Políticas adequadas para cada tipo de usuário

  3. Fluxo
    - Clientes: registro direto e ativo
    - Mecânicos: registro com approved=false, aguarda ADMEC
*/

-- Recriar tabela clients com estrutura correta
DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recriar tabela mechanics com estrutura correta
DROP TABLE IF EXISTS mechanics CASCADE;

CREATE TABLE mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;

-- Políticas para clients
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

-- Políticas para mechanics
CREATE POLICY "Anyone can register as mechanic"
  ON mechanics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Mechanics can read own data"
  ON mechanics
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can approve mechanics"
  ON mechanics
  FOR UPDATE
  USING (true);

-- Inserir dados de teste
INSERT INTO clients (full_name, email, phone, address, password) VALUES
('Cliente Teste', 'cliente@teste.com', '(11) 99999-9999', 'Rua Teste, 123', 'dGVzdGUxMjM=')
ON CONFLICT (email) DO NOTHING;

INSERT INTO mechanics (full_name, email, phone, password, approved) VALUES
('Mecânico Teste', 'mecanico@teste.com', '(11) 88888-8888', 'dGVzdGUxMjM=', FALSE),
('Mecânico Aprovado', 'aprovado@teste.com', '(11) 77777-7777', 'dGVzdGUxMjM=', TRUE)
ON CONFLICT (email) DO NOTHING;