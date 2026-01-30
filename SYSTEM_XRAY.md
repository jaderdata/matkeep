# 0) Visão geral do sistema
- **O que o sistema faz**: O MatKeep é uma plataforma SaaS multi-tenant para gestão de academias de artes marciais (foco em Jiu-Jitsu). Ele gerencia o cadastro de alunos, controle de frequência (presença) via Kiosk/QRCode, graduações (faixas/graus) e métricas financeiras/operacionais básicas.
- **Usuários e Objetivos**:
    - **Master Admin (Jader)**: Gerenciar todas as academias, resolver conflitos, visão global.
    - **Academy Admin (Professor/Dono)**: Gerenciar seus alunos, configurar regras de presença, visualizar dashboard financeiro/frequência.
    - **Aluno**: Fazer check-in (presença), visualizar histórico de treinos, ver graduação atual e carteirinha digital.
- **Contexto**: O sistema opera com isolamento estrito de dados entre academias (Multi-tenancy), mas permite que um mesmo e-mail física pertença a múltiplas academias (embora regras recentes de unicidade global estejam sendo reavaliadas).

# 1) Mapa de telas e rotas
| Tela | Rota | Propósito | Regras de Acesso |
| :--- | :--- | :--- | :--- |
| **Login** | `/login` | Identificar usuário (Admin ou Aluno). | Público. |
| **Forgot Password** | `/forgot-password` | Recuperação de senha. | Público. |
| **Academy Wizard** | `/register-academy` | Cadastro de nova academia. | Público (autenticado como novo user). |
| **Student Check-In** | `/check-in` | Kiosk para leitura de QRCode/Barcode. | Requer Auth (Admin). |
| **Master Layout** | `/master/*` | Área administrativa global. | Apenas email `jader_dourado@hotmail.com`. |
| **Master Dashboard** | `/master/dashboard` | Visão geral de todas as academias. | Master Admin. |
| **Academy Layout** | `/academy/*` | Área de gestão da academia. | Academy Admin. |
| **Dashboard** | `/academy/dashboard` | Métricas (alunos ativos, presença hoje). | Academy Admin. |
| **Students List** | `/academy/students` | CRUD de alunos, graduação, fotos. | Academy Admin. |
| **Calendar** | `/academy/calendar` | Visualização de aulas/presenças. | Academy Admin. |
| **Financial** | `/academy/financial` | Controle de mensalidades (básico). | Academy Admin. |
| **Settings** | `/academy/settings` | Configurações da academia (Logo, regras). | Academy Admin. |
| **Public Register** | `/register/:slug` | Formulário público de cadastro de aluno. | Público (usa Slug da academia). |
| **Student Portal** | `/student/portal` | Área do aluno (perfil, histórico). | Aluno Autenticado. |

# 2) Fluxos principais (end-to-end)

### F2.1 - Autenticação e Identificação (Secure Login)
- **Atores**: Todos os usuários.
- **Pré-condições**: Usuário cadastrado.
- **Passo a passo**:
    1. Usuário insere E-mail ou ID.
    2. Sistema chama RPC `identify_student` (bypass RLS parcial).
    3. Retorna lista de perfis associados (pode haver >1 se estiver em múltiplas academias).
    4. Se >1, usuário seleciona qual academia acessar.
    5. Usuário insere senha.
    6. Sistema valida credenciais na tabela `students` (para alunos) ou via Auth Provider (para admins).
- **Regras**:
    - BR-AUTH-01: Alunos não podem ver dados de outros alunos na identificação (RPC retorna apenas dados próprios).
- **Casos de erro**: "Student not found" (se não existir), "Invalid password".

### F2.2 - Registro Público de Aluno
- **Atores**: Visitante / Novo Aluno.
- **Pré-condições**: Link válido `/register/:slug`.
- **Passo a passo**:
    1. Acessa link com Slug da academia.
    2. Preenche form (Nome, Email, Senha, Foto).
    3. Clica "Register".
    4. Sistema executa RPC `check_email_exists_global`.
    5. Se email existe -> Bloqueia (Unicidade Global).
    6. Se novo -> Insere na tabela `students` com `academy_id` vinculado ao slug.
    7. Gera `internal_id` sequencial e `card_pass_code` (se não fornecido).
- **Regras**:
    - BR-REG-01: Email deve ser único globalmente (restaurado na Fase 5).
    - BR-REG-02: Slug deve corresponder a uma academia válida.
- **Dados tocados**: Tabela `students` (Insert).

### F2.3 - Check-In Kiosk (Presença)
- **Atores**: Aluno (passando carteirinha) em dispositivo do Admin.
- **Passo a passo**:
    1. Admin loga e acessa `/check-in`.
    2. Sistema carrega contexto da academia (`academy_id`).
    3. Aluno escaneia código (QR ou Barcode).
    4. Kiosk chama `attendanceService.registerAttendance(code, academy_id)`.
    5. Serviço busca aluno filtrando por `card_pass_code` E `academy_id`.
    6. Verifica regra de "Cooldown" (tempo mínimo entre treinos).
    7. Se OK -> Insere registro em `attendance`.
    8. Retorna Sucesso (Audio beep + Tela Verde).
- **Regras**:
    - BR-KIOSK-01: Isolamento estrito. Código de aluno da Academia A não é lido na Academia B.
    - BR-KIOSK-02: Cooldown de 33 minutos (configurável, default Hardcoded por enquanto) para evitar duplo check-in.
- **Mensagens**: "Bem vindo, [Nome]!", "Já registrou presença hoje (Tente novamente em X min)".
- **Erros**: "Student not found" (se for de outra academia ou código inválido).

### F2.4 - Visualização e Download de Carteirinha
- **Atores**: Admin.
- **Passo a passo**:
    1. Admin acessa Lista de Alunos.
    2. Clica menu `[...]` -> "View Digital Pass".
    3. Modal abre renderizando carteirinha (HTML/CSS com Tailwind).
    4. Clica "Download".
    5. Sistema converte DOM para PNG usando `html-to-image`.
    6. Browser inicia download do arquivo.
- **Dados tocados**: Leitura de `students` e `academies` (logo).

# 3) Regras de negócio e validações
| ID | Regra | Contexto | Mensagem de Falha |
| :--- | :--- | :--- | :--- |
| **BR-01** | **Unicidade de Email** | Cadastro de Aluno | "This email is already registered in the system." |
| **BR-02** | **Isolamento de Dados** | Todas as consultas | N/A (Retorna vazio/404 se tentar acessar dados de outro tenant). |
| **BR-03** | **Cooldown de Presença** | Kiosk / Check-in | "User already checked in recently. Wait X minutes." |
| **BR-04** | **Formato de Senha** | Cadastro / Reset | "Password must be at least 6 chars and 1 special char." |
| **BR-05** | **Slug Único** | Cadastro de Academia | "This URL slug is already taken." |

# 4) Mensagens do sistema (catálogo)
| Código | Contexto | Texto | Severidade |
| :--- | :--- | :--- | :--- |
| MSG-001 | Login | "Student not found." | Warn |
| MSG-002 | Kiosk | "Student does not belong to this academy." | Info/Warn |
| MSG-003 | Register | "Error registering student: [Detalhes]" | Error |
| MSG-004 | Card | "Failed to download card." | Error |
| MSG-005 | Auth | "Session expired. Please login again." | Info |

# 5) Modelo de dados (Banco)

## 5.1 Entidades Principais

### `academies`
- `id` (UUID, PK)
- `name` (Text)
- `slug` (Text, Unique, Indexed)
- `admin_email` (Text)
- `logo_url` (Text, Nullable)
- `settings` (JSONB) - Configs como dias para bandeira amarela/vermelha.

### `students`
- `id` (UUID, PK)
- `academy_id` (UUID, FK -> academies.id)
- `name` (Text)
- `email` (Text)
- `password` (Text) - *Obs: Plaintext ou hash simples atualmente (Assumption based on code).*
- `phone` (Text)
- `belt` (Text) - Enum (White, Blue, Purple, Brown, Black)
- `degrees` (Int)
- `status` (Text) - 'active', 'inactive'
- `card_pass_code` (Text, Unique) - Código do cartão/QR.
- `internal_id` (Int, Unique) - ID sequencial visível.
- `photo_url` (Text)

### `attendance`
- `id` (UUID, PK)
- `student_id` (UUID, FK -> students.id)
- `academy_id` (UUID, FK -> academies.id)
- `timestamp` (Timestamptz)

## 5.2 Relacionamentos
- **Academy** 1..N **Student** (Um aluno pertence a uma academia no registro, mas logicamente email pode repetir se constraint permitir - atualmente bloqueado por BR-01).
- **Academy** 1..N **Attendance**
- **Student** 1..N **Attendance** (Delete Cascade: Se aluno deletado, presenças somem).

## 5.3 Esquema Físico
- Banco: PostgreSQL (Supabase).
- RLS: Ativo em todas as tabelas.
- Policies:
    - `students`: Select/Insert/Update/Delete apenas se `auth.uid() -> academy.admin_email`.
    - `academies`: Select own.

# 6) Permissões e Papéis (RBAC)
| Papel | Descrição | Permissões |
| :--- | :--- | :--- |
| **Master Admin** | Superusuário hardcoded (`jader...`) | Vê tudo, entra como qualquer academia ("Act As"). |
| **Academy Admin** | Dono da conta | CRUD total na sua própria academia e alunos. |
| **Student** | Usuário final | Vê próprio perfil (via RPC/Portal), Histórico. Não edita dados sensíveis. |
| **Public** | Não autenticado | Apenas cadastro via Slug e Login inicial. |

# 7) Integrações externas
- **Supabase Auth**: Gestão de usuários (Admins).
- **Supabase Storage**: Fotos de perfil (`student-photos` bucket).
- **Supabase Database**: PostgreSQL hospedado.
- **ViaCEP** (Assumption): Provável uso para preenchimento de endereço (comum em sistemas BR).

# 8) Observabilidade e auditoria
- **Logs atuais**: `console.log` no frontend (dispersos).
- **Audit**: Nenhuma tabela específica de auditoria encontrada. Ações críticas (delete aluno) não deixam rastro além do desaparecimento do registro.
- **Métricas**: Dashboard conta `students.count` e `attendance` do dia.

# 9) Riscos, inconsistências e perguntas abertas
- **[P0] Segurança de Senha**: Alunos parecem ter senha salva em coluna simples na tabela `students`. Recomendado migrar para Supabase Auth Users ou hashing robusto.
- **[P1] Unicidade Global vs Multi-Academia**: A regra "Email único global" impede que um aluno treine em duas academias (ex: filial). O sistema atual força criação de outro email.
- **[P2] Dependência de 'Act As'**: A lógica de "Agir como" do Master Admin depende de `localStorage`. Se limpar cache, perde contexto.

# 10) Glossário
- **Card Pass**: Carteirinha digital com código de barras/QR para check-in.
- **Kiosk**: Modo de operação onde o dispositivo fica parado na recepção para leitura de códigos.
- **Slug**: Parte da URL que identifica a academia de forma única (ex: `matkeep.com/register/jader-bjj`).
- **Cooldown**: Tempo que o sistema bloqueia novos check-ins do mesmo aluno para evitar duplicidade.
