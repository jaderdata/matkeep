# ✅ CHECKLIST DE TESTES - Academy Admin

## 1. LOGIN E AUTENTICAÇÃO
- [x] Consegui fazer login como academy admin
- [ ] JWT token contém email correto
- [ ] Após logout/login, permissões são mantidas

**Para verificar JWT:**
Abra o navegador → DevTools → Application → localStorage → `sb-{project}-auth-token`

---

## 2. GERENCIAMENTO DE ESTUDANTES

### 2.1 VER ESTUDANTES
- [x] Consigo ver lista de estudantes da minha academy
- [ ] NÃO consigo ver estudantes de outras academies
- [ ] Dados aparecem corretamente (nome, email, telefone, etc)

**Local do código:** views/StudentManagement.tsx

### 2.2 REGISTRAR NOVO ESTUDANTE
- [ ] Consigo registrar novo estudante
- [ ] Novo estudante aparece na lista
- [ ] Campos preenchidos corretamente (phone_e164, full_name_normalized)

**Local do código:** views/StudentManagement.tsx → handleAddStudent()

### 2.3 EDITAR ESTUDANTE
- [ ] Consigo clicar em editar
- [ ] Consigo mudar dados (nome, email, phone)
- [ ] Dados são salvos no banco

**Local do código:** views/StudentManagement.tsx → handleUpdateStudent()

### 2.4 RESETAR SENHA DO ESTUDANTE
- [ ] Consigo clicar em "Reset Password"
- [ ] Modal abre pedindo confirmação
- [ ] Após confirmar, estudante recebe senha "123456"
- [ ] Estudante precisa trocar senha no próximo login

**Local do código:** views/StudentManagement.tsx → handleResetPassword()

### 2.5 ARQUIVAR ESTUDANTE (Soft Delete)
- [ ] Consigo clicar em "Archive Student"
- [ ] Estudante desaparece da lista (status = Inactive)
- [ ] Presença anterior é preservada (auditoria)
- [ ] Estudante NÃO consegue fazer check-in após arquivar

**Local do código:** views/StudentManagement.tsx → handleDelete()

### 2.6 DELETE PERMANENTE (Apenas Master Admin)
- [ ] Se você é Academy Admin: Botão "Delete Permanente" NÃO aparece ✓
- [ ] Se você é Master Admin: Botão aparece em vermelho
- [ ] Clica, pede confirmação com aviso vermelho
- [ ] Estudante é deletado do banco (com cascade)

**Local do código:** StudentManagement.tsx → handlePermanentDelete()

---

## 3. PRESENÇA (ATTENDANCE)

### 3.1 REGISTRAR PRESENÇA
- [ ] Consigo registrar presença de aluno
- [ ] Presença aparece com timestamp correto
- [ ] Método de check-in é registrado (card, phone, etc)

**Local do código:** views/StudentCheckIn.tsx

### 3.2 VER RELATÓRIO DE PRESENÇA
- [ ] Consigo ver histórico de presença
- [ ] Presença mostra date/hora/método
- [ ] NÃO consigo ver presença de outras academies

**Local do código:** views/AcademyReports.tsx

---

## 4. ESTUDANTE PORTAL (Student Side)

### 4.1 LOGIN DO ALUNO
- [ ] Aluno consegue fazer login com email ou phone_e164
- [ ] Email: `aluno@email.com`
- [ ] Phone: `+5511999999999` (E.164 format)

**Local do código:** views/StudentLogin.tsx

### 4.2 FORCED PASSWORD CHANGE (após reset)
- [ ] Se admin resetou senha, aluno vê modal bloqueante
- [ ] Modal pede nova senha (6+ chars + 1 special char)
- [ ] Após mudar, aluno consegue acessar portal

**Local do código:** views/StudentPortal.tsx

### 4.3 RATE LIMITING NO LOGIN
- [ ] 3 tentativas erradas de email/senha
- [ ] Após 3 erros, aparece mensagem bloqueando por 15 minutos
- [ ] Contador decresce a cada tentativa

**Local do código:** views/StudentLogin.tsx + services/rateLimitService.ts

### 4.4 CHECK-IN DO ALUNO
- [ ] Aluno consegue fazer check-in (card QR ou phone)
- [ ] Check-in é registrado com timestamp
- [ ] NÃO consegue fazer check-in 2x em 60 min (cooldown)

**Local do código:** services/attendanceService.ts

---

## 5. AUDIT LOGS

### 5.1 LOGS SÃO REGISTRADOS
- [ ] Cada ação gera log (password_reset, archive_student, etc)
- [ ] Log contém: ação, admin email, timestamp, detalhes
- [ ] NÃO consigo ver logs de outras academies

**Local do código:** services/auditService.ts

---

## 6. BANCO DE DADOS

### 6.1 NOVOS CAMPOS
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'students'
AND column_name IN ('phone_e164', 'full_name_normalized', 'must_change_password', 'archived_at');
```
- [ ] 4 colunas aparecem ✓

### 6.2 CONSTRAINT ÚNICO
```sql
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'students'
AND constraint_name = 'unique_academy_phone_fullname';
```
- [ ] Constraint existe ✓

### 6.3 RLS POLICIES
```sql
SELECT policyname FROM pg_policies
WHERE tablename = 'students'
AND schemaname = 'public';
```
- [ ] Múltiplas policies aparecem ✓

---

## 🎯 QUESTÕES ESPECÍFICAS

### Qual desses NÃO está funcionando para você?

1. **Ver estudantes:** ❌
   - Verifique: Role no JWT é 'academy_admin'?
   - Verifique: Email no JWT está correto?
   - Verifique: academies.admin_email === JWT email?

2. **Registrar novo estudante:** ❌
   - Verifique: Permissão INSERT na tabela students
   - Verifique: academy_id está correto?
   - Erro específico: qual é a mensagem?

3. **Reset senha:** ❌
   - Verifique: Função reset_student_password() foi criada
   - Verifique: Permissão UPDATE na tabela students
   - Erro específico: qual é a mensagem?

4. **Rate limiting:** ❌
   - localStorage está sendo usado (client-side)
   - Verifique: DevTools → Application → localStorage → rate_limit_*

5. **Soft delete:** ❌
   - Verifique: Campo archived_at foi criado
   - Verifique: Validação em attendanceService.ts

---

## 📋 TESTE RÁPIDO EM SQL

Copie e cole no Supabase Console → SQL Editor:

```sql
-- Ver qual é seu email
SELECT auth.jwt() ->> 'email' as seu_email;

-- Ver qual é sua role
SELECT auth.jwt() ->> 'role' as sua_role;

-- Ver quantos estudantes você consegue ver
SELECT COUNT(*) as total_estudantes 
FROM students;

-- Ver sua academy
SELECT * FROM academies 
WHERE admin_email = auth.jwt() ->> 'email';
```

---

## 🚨 ERROS COMUNS

| Erro | Causa | Solução |
|------|-------|--------|
| "Permission denied for students" | RLS policy bloqueando | Verifique admin_email no JWT |
| "Must change password" modal | Reset foi feito | Mude a senha para continuar |
| "Rate limit exceeded" | 3 tentativas erradas | Aguarde 15 minutos |
| "Student not found" | Estudante de outra academy | RLS isolamento funcionando ✓ |
| "Check-in failed" | Estudante arquivado | Restaure ou registre novo |

---

## ✅ PRÓXIMO PASSO

**Qual funcionalidade NÃO está funcionando?** 
- Descreva o que você tentou fazer
- Qual foi o erro/comportamento esperado vs real
- Copie a mensagem de erro (se houver)

Assim consigo ajudar especificamente! 🎯
