-- Migração: Novas Regras de Negócio e Limpeza de Dados
-- Data: 2026-01-30

BEGIN;

-- 1. LIMPEZA DA ACADEMIA 'aca-t6yoo3uwa' (Jader bjj)
DO $$ 
DECLARE 
    v_academy_id TEXT := 'aca-t6yoo3uwa';
BEGIN
    DELETE FROM attendance WHERE academy_id = v_academy_id;
    DELETE FROM student_documents WHERE academy_id = v_academy_id;
    DELETE FROM academy_events WHERE academy_id = v_academy_id;
    DELETE FROM password_reset_audit WHERE academy_id = v_academy_id;
    DELETE FROM audit_logs WHERE academy_id = v_academy_id;
    DELETE FROM students WHERE academy_id = v_academy_id;
    DELETE FROM academies WHERE id = v_academy_id;
END $$;

-- 2. LIMPEZA DE REGISTROS DE ALUNO DO DONO (jaderdata@gmail.com) EM OUTRAS ACADEMIAS
-- Para garantir que possamos aplicar a nova regra sem conflitos imediatos
DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE email = 'jaderdata@gmail.com');
DELETE FROM student_documents WHERE student_id IN (SELECT id FROM students WHERE email = 'jaderdata@gmail.com');
DELETE FROM password_reset_audit WHERE student_id IN (SELECT id FROM students WHERE email = 'jaderdata@gmail.com');
DELETE FROM students WHERE email = 'jaderdata@gmail.com';

-- 3. REGRA: ALUNO SÓ PODE SER INSCRITO EM UMA ACADEMIA (E-mail Único)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_key;
ALTER TABLE students ADD CONSTRAINT students_email_key UNIQUE (email);

-- 4. REGRA: ALUNO NÃO PODE SER DONO DE ACADEMIA
-- Função para validar a inserção de estudante
CREATE OR REPLACE FUNCTION check_student_not_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM academies WHERE admin_email = NEW.email) THEN
    RAISE EXCEPTION 'This email belongs to an Academy Owner and cannot be registered as a student.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_student_not_owner ON students;
CREATE TRIGGER tr_check_student_not_owner
BEFORE INSERT OR UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION check_student_not_owner();

-- Função para validar a criação de academia
CREATE OR REPLACE FUNCTION check_owner_not_student()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM students WHERE email = NEW.admin_email) THEN
    RAISE EXCEPTION 'This email is already registered as a student and cannot be used for an Academy Owner profile.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_owner_not_student ON academies;
CREATE TRIGGER tr_check_owner_not_student
BEFORE INSERT OR UPDATE ON academies
FOR EACH ROW EXECUTE FUNCTION check_owner_not_student();

COMMIT;
