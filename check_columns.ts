
import { supabase } from './services/supabase';

async function checkSchema() {
    const { data, error } = await supabase
        .from('academies')
        .select('*')
        .limit(1);

    if (data && data.length > 0) {
        console.log('Columns in academies:', Object.keys(data[0]));
    } else {
        console.log('No data in academies or error:', error);
    }
}

checkSchema();
