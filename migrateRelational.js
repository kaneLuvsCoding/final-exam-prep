import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("🚀 Starting Data Migration to Structure...");

  // 1. Fetch Subject mappings
  const { data: subjects } = await supabase.from('subjects').select('id, name');
  const subjectMap = {};
  subjects.forEach(s => subjectMap[s.name] = s.id);
  console.log("✅ Subjects mapped:", subjectMap);

  // 2. Fetch all questions to process
  const { data: questions, error: qErr } = await supabase.from('questions').select('id, subject, topic');
  if (qErr) {
    console.error("Error fetching questions:", qErr);
    return;
  }
  console.log(`✅ Found ${questions.length} questions to process.`);

  // 3. Find unique topics per subject
  const subjectTopics = {}; 
  for (const q of questions) {
    const s_id = subjectMap[q.subject];
    if (s_id && q.topic) {
      if (!subjectTopics[s_id]) subjectTopics[s_id] = new Set();
      subjectTopics[s_id].add(q.topic);
    }
  }

  // 4. Insert Topics into 'topics' table
  const topicsToInsert = [];
  for (const [s_id, topics] of Object.entries(subjectTopics)) {
    for (const t of topics) {
      topicsToInsert.push({ subject_id: parseInt(s_id), name: t });
    }
  }

  console.log(`➡️ Inserting ${topicsToInsert.length} unique topics...`);
  const { data: insertedTopics, error: tErr } = await supabase
    .from('topics')
    .insert(topicsToInsert)
    .select('id, subject_id, name');

  if (tErr) {
    console.error("❌ Failed to insert topics:", tErr);
    return;
  }
  
  // Create a fast lookup map for topic IDs
  const topicMap = {};
  insertedTopics.forEach(t => {
    if (!topicMap[t.subject_id]) topicMap[t.subject_id] = {};
    topicMap[t.subject_id][t.name] = t.id;
  });
  console.log("✅ Topics inserted and mapped.");

  // 5. Update questions with respective subject_id and topic_id
  console.log("➡️ Updating questions with new IDs...");
  let count = 0;
  for (const q of questions) {
    const s_id = subjectMap[q.subject];
    if (s_id) {
      const t_id = topicMap[s_id]?.[q.topic];
      
      // Update only if not already updated to save requests and prevent partial fails
      const { data: check } = await supabase.from('questions').select('topic_id').eq('id', q.id).single();
      if (check && check.topic_id) {
        count++;
        continue;
      }
      
      const { error: updateErr } = await supabase
        .from('questions')
        .update({ subject_id: s_id, topic_id: t_id })
        .eq('id', q.id);

      if (updateErr) {
        console.error(`❌ Failed to update question ${q.id}:`, updateErr.message);
      } else {
        count++;
      }
    }
  }

  console.log(`🎉 Migration Complete! Successfully updated ${count} questions with relational IDs.`);
}

runMigration();