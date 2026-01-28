
import { supabase } from './services/supabase';

async function testFetch() {
    const { data, error } = await supabase
        .from('academies')
        .select('admin_email')
        .limit(1);

    if (error) {
        console.log('Error (likely column missing):', error.message);
    } else {
        console.log('Column admin_email exists!');
    }
}

testFetch();
