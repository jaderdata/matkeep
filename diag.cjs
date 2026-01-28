
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabase = createClient(
    env['VITE_SUPABASE_URL'],
    env['VITE_SUPABASE_ANON_KEY']
);

async function diag() {
    const { data, error } = await supabase
        .from('academies')
        .select('*')
        .limit(1)
        .single();

    if (data) {
        console.log('Columns:', Object.keys(data));
        console.log('Sample Data:', data);
    } else {
        console.log('Error:', error);
    }
}

diag();
