# Guia de Aplicação das Migrations - MatKeep MVP

## 📋 Pré-requisitos
- Acesso ao Supabase Console
- Acesso a uma conta Supabase com permissões de administrador
- Editor de SQL do Supabase disponível

---

## 🔧 Passo 1: Aplicar Migration 001 (Campos de Telefone e Reset de Senha)

### Via Supabase Console (Recomendado)

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto MatKeep
3. Vá para **SQL Editor** no menu lateral esquerdo
4. Clique em **New Query**
5. Cole todo o conteúdo do arquivo `migrations/001_add_phone_password_reset_fields.sql`
6. Clique em **Run** (botão azul no canto superior direito)
7. Aguarde a conclusão (deve aparecer "Success" para cada comando)

### Via Supabase CLI (Alternativa)

```powershell
# Instale o Supabase CLI se ainda não tiver
# npm install -g supabase

# Entre no diretório do projeto
cd c:\Users\hp user\Documents\Dev\Matkeep

# Execute a migration
supabase db push
```

---

## 🔐 Passo 2: Aplicar Migration 002 (Função de Delete Permanente)

### Via Supabase Console

1. No **SQL Editor**, clique em **New Query** novamente
2. Cole todo o conteúdo do arquivo `migrations/002_add_permanent_delete_function.sql`
3. Clique em **Run**
4. Aguarde confirmação de sucesso

---

## 👤 Passo 3: Configurar Master Admin com Role 'master'

### Via Supabase Console (RLS/Auth)

**Opção A: Via SQL (Mais Direto)**

1. Vá para **SQL Editor** → **New Query**
2. Execute este comando (substitua `seu-email@example.com` pelo email do Master Admin):

```sql
-- Atualizar JWT claim para Master Admin
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('role', 'master')
    ELSE raw_user_meta_data || jsonb_build_object('role', 'master')
  END
WHERE email = 'jader_dourado@hotmail.com';
```

3. Clique em **Run**

**Opção B: Via Auth Dashboard (Manual)**

1. Vá para **Authentication** → **Users** no menu lateral
2. Encontre o Master Admin (email: `jader_dourado@hotmail.com`)
3. Clique no usuário
4. Vá para aba **User Metadata** (JSON)
5. Adicione ou atualize o JSON com:
```json
{
  "role": "master"
}
```
6. Clique em **Update user metadata**

---

## ✅ Passo 4: Verificar Aplicação das Migrations

### Verificar Campos Adicionados

```sql
-- Executar no SQL Editor para confirmar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('phone_e164', 'full_name_normalized', 'must_change_password', 'temp_password_expires_at', 'archived_at')
ORDER BY column_name;
```

Esperado: 5 linhas com as colunas adicionadas

### Verificar Constraint

```sql
-- Verificar se o constraint único foi criado
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'students' 
  AND constraint_name LIKE '%phone_fullname%';
```

Esperado: `unique_academy_phone_fullname`

### Verificar Tabela de Auditoria

```sql
-- Confirmar que password_reset_audit foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'password_reset_audit' 
  AND table_schema = 'public';
```

Esperado: `password_reset_audit`

### Verificar Funções RPC

```sql
-- Listar funções criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('archive_student', 'reset_student_password', 'delete_student_permanently');
```

Esperado: 3 funções listadas

### Verificar Role do Master Admin

```sql
-- Confirmar que o Master Admin tem a role 'master'
SELECT email, raw_user_meta_data->'role' as role 
FROM auth.users 
WHERE email = 'jader_dourado@hotmail.com';
```

Esperado: `{"role": "master"}`

---

## 🧪 Passo 5: Teste de Funcionamento (Opcional)

### Testar Normalization de Nome

```sql
-- Testar normalização de nomes com acentos
SELECT 
  'João Silva' as original,
  lower(regexp_replace(regexp_replace(regexp_replace(regexp_replace('João Silva', '[áàâãä]', 'a', 'g'), '[éèêë]', 'e', 'g'), '[íìîï]', 'i', 'g'), '[óòôõö]', 'o', 'g')) as normalized;
```

Esperado: `joao silva`

### Testar Função de Reset de Senha

```sql
-- CUIDADO: Isso vai resetar a senha de um aluno de teste!
-- Substitua o UUID pelo ID de um aluno de teste
SELECT * FROM reset_student_password(
  'UUID-DO-ALUNO-TESTE'::uuid,
  'UUID-DA-ACADEMY'::uuid,
  'admin@academy.com'
);
```

---

## 🚨 Troubleshooting

### Erro: "Column already exists"
- As migrations já foram aplicadas anteriormente
- Verifique se os campos já estão na tabela

### Erro: "Constraint violation" no unique constraint
- Pode haver duplicatas de (academy_id, phone_e164, full_name_normalized)
- Revise os dados ou remova o constraint antes de reaplicar

### Erro: "Function already exists"
- Use `CREATE OR REPLACE FUNCTION` (já incluído nos scripts)
- Ou dropie a função antes de criar novamente

### Master Admin não consegue deletar permanentemente
- Confirme que o user metadata foi atualizado com `"role": "master"`
- Faça logout/login para que o JWT seja atualizado
- Verifique no browser DevTools (Application → Cookies/LocalStorage) se o JWT contém `"role": "master"`

---

## 📝 Resumo de Mudanças

| Item | Descrição |
|------|-----------|
| **Tabela `students`** | +5 colunas (phone_e164, full_name_normalized, must_change_password, temp_password_expires_at, archived_at) |
| **Constraint** | UNIQUE(academy_id, phone_e164, full_name_normalized) |
| **Tabela Nova** | `password_reset_audit` com RLS |
| **Índices** | 8 índices novos para performance |
| **Funções RPC** | `archive_student()`, `reset_student_password()`, `delete_student_permanently()` |
| **RLS Policies** | Adicionadas para `password_reset_audit` |
| **Master Admin** | Recebe claim JWT `role: 'master'` |

---

## 🎯 Próximas Etapas

Após aplicar as migrations:

1. ✅ Testar login com Master Admin
2. ✅ Testar reset de senha em StudentManagement
3. ✅ Testar soft delete (archive) de estudante
4. ✅ Testar delete permanente (Master Admin only)
5. ✅ Testar forced password change no StudentPortal
6. ✅ Testar rate limiting no StudentLogin

---

**Data**: 2026-01-30  
**Status**: Pronto para Aplicação  
**Versão**: MVP v1.0.0
