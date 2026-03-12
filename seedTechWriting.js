import { createClient } from "@supabase/supabase-js";
import { techWriting } from "./src/data/techWriting.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const sp = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching topics and subjects...");
  const { data: topics } = await sp.from("topics").select("*");
  const { data: subjects } = await sp.from("subjects").select("*");
  const { data: existingQs } = await sp.from("questions").select("question");

  const existingSet = new Set(existingQs.map(q => q.question.trim()));
  let inserted = 0;

  async function processApp(subjectName, dataObj) {
    const subject = subjects.find(s => s.name === subjectName);
    if (!subject) throw new Error("Subject missing: " + subjectName);

    for (const [topicName, qList] of Object.entries(dataObj)) {
      let topic = topics.find(t => t.name === topicName && t.subject_id === subject.id);
      
      if (!topic) {
        console.log(`Creating topic: ${topicName} for ${subjectName}`);
        const { data: newTopic, error: tErr } = await sp.from("topics").insert({ name: topicName, subject_id: subject.id }).select().single();
        if (tErr) throw tErr;
        topic = newTopic;
        topics.push(topic);
      }

      for (const item of qList) {
        if (!existingSet.has(item.question.trim())) {
          const payload = {
            subject_id: subject.id,
            topic_id: topic.id,
            question: item.question,
            answer: Array.isArray(item.answer) ? item.answer.join('\n') : item.answer
          };
          const { error } = await sp.from("questions").insert(payload);
          if (error) {
            console.error("Failed to insert question:", item.question.substring(0, 30), error.message);
          } else {
            inserted++;
            existingSet.add(item.question.trim());
            if (inserted % 10 === 0) console.log(`Inserted ${inserted} questions so far...`);
          }
        }
      }
    }
  }

  await processApp("Technical Writing", techWriting);

  console.log(`Migration complete. Inserted ${inserted} missing technical writing questions.`);
}

run().catch(console.error);