import { createClient } from '@supabase/supabase-js';

// Import data from the remaining files
import { adbms } from './src/data/adbms.js';
import { algorithms } from './src/data/algorithms.js';
import { sqm } from './src/data/sqm.js';
import { techWriting } from './src/data/techWriting.js';

// Load Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
  console.error("❌ Error: Missing or invalid Supabase URL.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define subjects and their corresponding data
const dataSets = [
  { name: "Advanced DBMS", data: adbms },
  { name: "Analysis of Algorithm", data: algorithms },
  { name: "SQM", data: sqm },
  { name: "Technical Writing", data: techWriting }
];

async function seedData() {
  let totalInserted = 0;
  let totalErrors = 0;

  for (const dataset of dataSets) {
    const subject = dataset.name;
    const dbData = dataset.data;
    
    console.log(`\n🚀 Starting to migrate ${subject} data...`);

    for (const [category, questionsList] of Object.entries(dbData)) {
      console.log(`➡️ Processing ${category}...`);
      
      for (const item of questionsList) {
        
        // Handle answers (can be string, array of strings, or array of arrays for comparisons)
        let processedAnswer = '';
        if (Array.isArray(item.answer)) {
          // Check if it's an array of arrays (like in some SQM comparisons)
          if (Array.isArray(item.answer[0])) {
            processedAnswer = JSON.stringify(item.answer); // Store as JSON string if it's strictly multi-dimensional
          } else {
            processedAnswer = item.answer.join('\n');
          }
        } else {
          processedAnswer = item.answer || '';
        }

        const payload = {
          subject: subject,
          // 'topic' column maps to category, 'type' column maps to 'comparison' if any or category as fallback
          topic: category,  
          type: item.type ? item.type : category, 
          question: item.question,
          answer: processedAnswer,
        };

        // If sqm has 'headers' for comparison tables
        if (item.headers) {
          payload.headers = item.headers; // Assuming jsonb column can take array directly
        }

        const { error } = await supabase.from('questions').insert([payload]);
        
        if (error) {
          console.error(`❌ Failed: "${item.question.substring(0, 30)}..." -> Error:`, error.message);
          totalErrors++;
        } else {
          totalInserted++;
        }
      }
      console.log(`✅ ${category} done.`);
    }
  }
  
  console.log(`\n🎉 All Remaining Migrations Complete! 
📊 Successfully inserted: ${totalInserted} questions.
⚠️ Errors: ${totalErrors}`);
}

seedData();