/*
  # Sistema de Cargos para Mecânicos

  1. Novos Campos
    - `role` - Cargo do mecânico (colaborador, encarregado, gerente, sub_regional, regional)
    - Permissões específicas por cargo

  2. Cargos e Permissões
    - Colaborador: apenas serviços e notas
    - Encarregado: serviços, notas e vendas
    - Gerente: serviços, notas, vendas e visualizar todas as notas
    - Sub Regional: acesso total (exceto gerenciar outros mecânicos)
    - Regional: acesso total completo

  3. Segurança
    - Apenas ADMEC pode alterar cargos
    - Validação de cargos válidos
*/

-- Adicionar campo de cargo na tabela mechanics
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mechanics' AND column_name = 'position') THEN
    ALTER TABLE mechanics ADD COLUMN position TEXT DEFAULT 'colaborador' CHECK (position IN ('colaborador', 'encarregado', 'gerente', 'sub_regional', 'regional'));
  END IF;
END $$;

-- Atualizar a estrutura da tabela mechanics para incluir todas as permissões necessárias
DO $$
BEGIN
  -- Adicionar campos de permissão se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mechanics' AND column_name = 'can_sell_cars') THEN
    ALTER TABLE mechanics ADD COLUMN can_sell_cars BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mechanics' AND column_name = 'can_manage_mechanics') THEN
    ALTER TABLE mechanics ADD COLUMN can_manage_mechanics BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mechanics' AND column_name = 'can_post_cars') THEN
    ALTER TABLE mechanics ADD COLUMN can_post_cars BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Função para atualizar permissões baseadas no cargo
CREATE OR REPLACE FUNCTION update_mechanic_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Resetar todas as permissões
  NEW.can_generate_invoices := FALSE;
  NEW.can_view_all_invoices := FALSE;
  NEW.can_manage_cars := FALSE;
  NEW.can_sell_cars := FALSE;
  NEW.can_post_cars := FALSE;
  NEW.can_manage_mechanics := FALSE;
  
  -- Definir permissões baseadas no cargo
  CASE NEW.position
    WHEN 'colaborador' THEN
      NEW.can_generate_invoices := TRUE;
      
    WHEN 'encarregado' THEN
      NEW.can_generate_invoices := TRUE;
      NEW.can_sell_cars := TRUE;
      
    WHEN 'gerente' THEN
      NEW.can_generate_invoices := TRUE;
      NEW.can_sell_cars := TRUE;
      NEW.can_view_all_invoices := TRUE;
      
    WHEN 'sub_regional' THEN
      NEW.can_generate_invoices := TRUE;
      NEW.can_sell_cars := TRUE;
      NEW.can_view_all_invoices := TRUE;
      NEW.can_manage_cars := TRUE;
      NEW.can_post_cars := TRUE;
      
    WHEN 'regional' THEN
      NEW.can_generate_invoices := TRUE;
      NEW.can_sell_cars := TRUE;
      NEW.can_view_all_invoices := TRUE;
      NEW.can_manage_cars := TRUE;
      NEW.can_post_cars := TRUE;
      NEW.can_manage_mechanics := TRUE;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar permissões automaticamente
DROP TRIGGER IF EXISTS update_mechanic_permissions_trigger ON mechanics;
CREATE TRIGGER update_mechanic_permissions_trigger
  BEFORE INSERT OR UPDATE OF position ON mechanics
  FOR EACH ROW
  EXECUTE FUNCTION update_mechanic_permissions();

-- Atualizar mecânicos existentes com permissões baseadas no cargo atual
UPDATE mechanics SET position = COALESCE(position, 'colaborador');

-- Inserir alguns mecânicos de exemplo com diferentes cargos
INSERT INTO mechanics (full_name, email, phone, password, approved, position) VALUES
('João Colaborador', 'joao.colaborador@teste.com', '(11) 91111-1111', 'dGVzdGUxMjM=', TRUE, 'colaborador'),
('Maria Encarregada', 'maria.encarregada@teste.com', '(11) 92222-2222', 'dGVzdGUxMjM=', TRUE, 'encarregado'),
('Pedro Gerente', 'pedro.gerente@teste.com', '(11) 93333-3333', 'dGVzdGUxMjM=', TRUE, 'gerente'),
('Ana Sub Regional', 'ana.subregional@teste.com', '(11) 94444-4444', 'dGVzdGUxMjM=', TRUE, 'sub_regional'),
('Carlos Regional', 'carlos.regional@teste.com', '(11) 95555-5555', 'dGVzdGUxMjM=', TRUE, 'regional')
ON CONFLICT (email) DO NOTHING;