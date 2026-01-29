Senha: 123456
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzxwzynztonsimljzihu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eHd6eW56dG9uc2ltbGp6aWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MTI2MDksImV4cCI6MjA4NTA4ODYwOX0.TPdNz_sLExY5Gh6nSj3QshHRIMbElK-q37dDX28nbTY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetPassword() {
    const email = 'jaderdata@gmail.com';

    console.log('Tentando entrar com a senha antiga para redefinir...');

    // Tentar entrar com a senha que eu usei no script anterior (password123456)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123456',
    });

    if (signInError) {
        console.log('Não consegui entrar com "password123456". Tentando criar do zero ou redefinir...');
        // Se falhou, talvez eu consiga apenas dar um signUp com a nova se o Auth permitir "overwrites" (raro)
        // Ou talvez já seja 123456? Vamos tentar entrar com 123456.
        const { error: e2 } = await supabase.auth.signInWithPassword({ email, password: '123456' });
        if (!e2) {
            console.log('A senha já é 123456!');
            return;
        }
        console.error('Erro de login persistente:', e2.message);
    } else {
        console.log('Logado! Atualizando senha para 123456...');
        const { error: updateError } = await supabase.auth.updateUser({
            password: '123456'
        });

        if (updateError) {
            console.error('Erro ao atualizar:', updateError.message);
        } else {
            console.log('Senha atualizada com sucesso para 123456.');
        }
    }
}

resetPassword();
