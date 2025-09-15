@@ .. @@
 -- Inserir dados de teste para verificar funcionamento
 INSERT INTO mechanics (full_name, email, phone, password, authorized) VALUES
 ('João Silva', 'joao@teste.com', '(11) 99999-9999', 'c2VuaGExMjM=', FALSE),
-('Maria Santos', 'maria@teste.com', '(11) 88888-8888', 'c2VuaGE0NTY=', TRUE)
+('Maria Santos', 'maria@teste.com', '(11) 88888-8888', 'c2VuaGE0NTY=', TRUE),
+('Mecânico Teste', 'mecanico@teste.com', '(11) 55555-5555', 'dGVzdGUxMjM=', TRUE)
 ON CONFLICT (email) DO NOTHING;
 
 INSERT INTO clients (full_name, email, phone, password) VALUES
 ('Pedro Cliente', 'pedro@cliente.com', '(11) 77777-7777', 'c2VuaGE3ODk='),
-('Ana Cliente', 'ana@cliente.com', '(11) 66666-6666', 'c2VuaGEwMTI=')
+('Ana Cliente', 'ana@cliente.com', '(11) 66666-6666', 'c2VuaGEwMTI='),
+('Cliente Teste', 'cliente@teste.com', '(11) 44444-4444', 'dGVzdGUxMjM=')
 ON CONFLICT (email) DO NOTHING;