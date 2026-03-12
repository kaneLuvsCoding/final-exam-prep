import { createClient } from '@supabase/supabase-js';
import { bmis } from './src/data/bmis.js';

// Load Supabase credentials from environment variables 
// (Make sure to run this file with: node --env-file=.env seedData.js)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
  console.error("❌ Error: Missing or invalid Supabase URL. Please add true credentials to your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  const subject = "BMIS"; // Matching the dropdown name in Admin panel
  let insertedCount = 0;
  let errorsCount = 0;

  console.log(`🚀 Starting to migrate ${subject} data to Supabase...`);

  // Loop through categories (e.g. "Short Questions", "Long Questions")
  for (const [category, questionsList] of Object.entries(bmis)) {
    console.log(`\n➡️ Processing ${category}...`);
    
    // Loop through each question in the category
    for (const item of questionsList) {
      const payload = {
        subject: subject,
        type: category, // DB uses 'type' instead of 'category'
        question: item.question,
        // The DB 'answer' column is of type 'text', so we join the array into a single string
        answer: Array.isArray(item.answer) ? item.answer.join('\n') : item.answer,
      };
      
      // Insert to Supabase DB 'questions' table
      const { error } = await supabase.from('questions').insert([payload]);
      
      if (error) {
        console.error(`❌ Failed to insert: "${item.question.substring(0, 30)}..." -> Error:`, error.message);
        errorsCount++;
      } else {
        console.log(`✅ Success: Injected -> "${item.question.substring(0, 30)}..."`);
        insertedCount++;
      }
    }
  }
  
  console.log(`\n🎉 Migration Complete! 
📊 Successfully inserted: ${insertedCount} questions.
⚠️ Errors: ${errorsCount}`);
}

seedData();