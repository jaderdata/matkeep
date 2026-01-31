# ⚠️ CORREÇÃO CRÍTICA - RLS Policies para Academy Admins

## Situação Atual (QUEBRADA ❌)

```
Master Admin (jader_dourado@hotmail.com)
├─ ✅ Vê TODAS academias
├─ ✅ Vê TODOS estudantes
├─ ✅ Pode fazer TUDO
└─ PROBLEMA: Academy admins não conseguem fazer NADA!

Academy Admin (admin@academy.com)
├─ ❌ NÃO consegue ver seus próprios estudantes
├─ ❌ NÃO consegue registrar presença
├─ ❌ NÃO consegue gerenciar documentos
└─ RESULTADO: Sistema inútil para admins de academias

Student (aluno@academy.com)
├─ ❌ NÃO consegue fazer login
├─ ❌ NÃO consegue registrar presença
└─ RESULTADO: Ninguém consegue usar o app
```

---

## Solução (CORRIGIDO ✅)

Criação da migration: `003_fix_rls_policies_for_academy_admins.sql`

```
Master Admin (jader_dourado@hotmail.com)
├─ ✅ Vê TODAS academias
├─ ✅ Vê TODOS estudantes
├─ ✅ Pode fazer TUDO
└─ ✅ Acesso full ao sistema

Academy Admin (admin@academy.com)
├─ ✅ Vê SUA academia
├─ ✅ Vê seus estudantes
├─ ✅ Pode gerenciar presença
├─ ✅ Pode gerenciar documentos
└─ ✅ Acesso completo à sua academy

Student (aluno@academy.com)
├─ ✅ Consegue fazer login
├─ ✅ Consegue registrar presença
└─ ✅ Consegue usar o portal
```

---

## Como as Regras Funcionam Agora

### **1. STUDENTS TABLE**
```
QUEM PODE VER?
- Admin da academy ✅
- Master Admin ✅
- Outro academy admin ❌ (isolamento)

QUEM PODE EDITAR?
- Admin da academy ✅
- Master Admin ✅
```

### **2. ATTENDANCE TABLE**
```
QUEM PODE REGISTRAR PRESENÇA?
- Admin da academy ✅
- Master Admin ✅
- Alunos (implícito para próprio check-in) ✅

QUEM PODE VER?
- Admin da academy ✅
- Master Admin ✅
```

### **3. ACADEMIES TABLE**
```
QUEM PODE VER SUA ACADEMY?
- Admin da academy ✅
- Master Admin ✅ (vê todas)
- Outro academy admin ❌ (isolamento)
```

---

## Lógica da RLS Policy (Exemplo)

```sql
-- Para estudantes:
-- "Deixa passar se:"
--   1. O usuário é admin da academy que contém esse student OU
--   2. O usuário é Master Admin
--
CREATE POLICY students_select_academy_admin
  ON students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = students.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'  -- ← Verifica email do admin
    )
    OR auth.jwt() ->> 'role' = 'master'  -- ← Ou verifica se é master
  );
```

---

## Próximos Passos

1. ✅ Vá para **Supabase Console → SQL Editor**
2. ✅ Crie uma **New Query**
3. ✅ Cole todo o conteúdo de `migrations/003_fix_rls_policies_for_academy_admins.sql`
4. ✅ Clique em **Run**
5. ✅ Faça **logout/login** para atualizar o JWT
6. ✅ Agora academy admins podem:
   - Ver seus estudantes
   - Registrar presença
   - Gerenciar documentos
   - Gerenciar academy

---

## ⚠️ IMPORTANTE

**Sem essa migration:**
- ❌ Sistema não funciona para ninguém
- ❌ Só Master Admin consegue fazer algo

**Com essa migration:**
- ✅ Master Admin: Controle total
- ✅ Academy Admin: Controle da sua academy
- ✅ Students: Conseguem usar o portal

