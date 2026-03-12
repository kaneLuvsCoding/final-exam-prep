
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync('.env', 'utf8');
const envVars = Object.fromEntries(env.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));

const supabaseUrl = envVars.VITE_SUPABASE_URL.trim();
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['semesters', 'majors', 'semester_majors', 'major_subjects'];
  let results = "Testing operations...\n";
  
  for (const table of tables) {
    console.log(`Testing ${table}...`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      results += `❌ Table '${table}' select failed: ${error.message} (${error.code})\n`;
    } else {
      results += `✅ Table '${table}' select OK. Row count: ${data.length}\n`;
      
      if (table === 'semester_majors') {
        results += "Attempting test insert into semester_majors...\n";
        // We need a valid major_id and semester_id if there are FKs
        const { data: sem } = await supabase.from('semesters').select('id').limit(1).single();
        const { data: maj } = await supabase.from('majors').select('id').limit(1).single();
        
        if (sem && maj) {
          const { error: insErr } = await supabase.from('semester_majors').insert({ major_id: maj.id, semester_id: sem.id });
          if (insErr) {
            results += `❌ semester_majors insert failed: ${insErr.message} (${insErr.code})\n`;
          } else {
            results += "✅ semester_majors insert OK.\n";
            const { error: delErr } = await supabase.from('semester_majors').delete().eq('major_id', maj.id).eq('semester_id', sem.id);
            if (delErr) {
              results += `❌ semester_majors delete failed: ${delErr.message} (${delErr.code})\n`;
            } else {
              results += "✅ semester_majors delete OK.\n";
            }
          }
        } else {
          results += "⚠️ Could not test insert: no semesters or majors found.\n";
        }
      }
    }
  }
  fs.writeFileSync('results.txt', results);
  console.log("Done. Results in results.txt");
}

checkTables();
