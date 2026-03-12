import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets?.map(b => b.name));

  const { data: imgData, error: imgError } = await supabase.from('images').select('*').limit(1);
  console.log('Images table check:', imgError ? imgError.message : 'exists', imgData);

  const { data: pdfData, error: pdfError } = await supabase.from('pdfs').select('*').limit(1);
  console.log('PDFs table check:', pdfError ? pdfError.message : 'exists', pdfData);
}

run();
