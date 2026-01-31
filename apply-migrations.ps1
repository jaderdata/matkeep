#!/usr/bin/env powershell
# MatKeep Migration Script - Instruções para aplicar migrations no Supabase
# Data: 2026-01-30

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MatKeep MVP - Migration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASSO 1: Aplicar SQL Migrations" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Va para https://supabase.com/dashboard" -ForegroundColor Green
Write-Host "1. Selecione o projeto MatKeep" -ForegroundColor Gray
Write-Host "2. Clique em 'SQL Editor' no menu" -ForegroundColor Gray
Write-Host "3. Clique em 'New Query'" -ForegroundColor Gray
Write-Host "4. Cole: migrations/001_add_phone_password_reset_fields.sql" -ForegroundColor Cyan
Write-Host "5. Clique em 'Run'" -ForegroundColor Gray
Write-Host "6. Aguarde 'Success'" -ForegroundColor Gray
Write-Host "7. Repita para: migrations/002_add_permanent_delete_function.sql" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASSO 2: Configurar Master Admin" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Gray
Write-Host ""
Write-Host "SQL Editor > New Query > Cole:" -ForegroundColor Green
Write-Host ""
Write-Host "UPDATE auth.users" -ForegroundColor Cyan
Write-Host "SET raw_user_meta_data = CASE" -ForegroundColor Cyan
Write-Host "  WHEN raw_user_meta_data IS NULL" -ForegroundColor Cyan
Write-Host "  THEN jsonb_build_object('role', 'master')" -ForegroundColor Cyan
Write-Host "  ELSE raw_user_meta_data || jsonb_build_object('role', 'master')" -ForegroundColor Cyan
Write-Host "END" -ForegroundColor Cyan
Write-Host "WHERE email = 'jader_dourado@hotmail.com';" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASSO 3: Verificar" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Gray
Write-Host ""
Write-Host "SQL Editor > New Query > Cole:" -ForegroundColor Green
Write-Host ""
Write-Host "SELECT column_name FROM information_schema.columns" -ForegroundColor Cyan
Write-Host "WHERE table_name = 'students'" -ForegroundColor Cyan
Write-Host "AND column_name IN ('phone_e164','full_name_normalized'," -ForegroundColor Cyan
Write-Host "  'must_change_password', 'temp_password_expires_at', 'archived_at');" -ForegroundColor Cyan
Write-Host ""
Write-Host "Esperado: 5 colunas listadas" -ForegroundColor Yellow
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Pronto! Aplique no Supabase Console" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

