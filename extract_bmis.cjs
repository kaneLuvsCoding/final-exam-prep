const fs = require('fs');

const text = fs.readFileSync('pdf_text.txt', 'utf8');

// The text format is roughly:
// Q1. Question text
// A. Option A
// B. Option B
// C. Option C
// D. Option D
// Answer: Letter. Text

const questions = [];
const lines = text.split('\n').map(l => l.trim());

let currentQ = null;

for (let i = 0; i < lines.length; i++) {
     let line = lines[i];

     // Skip empty lines or page breaks
     if (!line || line.includes('----------------Page')) continue;

     // Detect new question: Starts with Q followed by number and dot
     const qMatch = line.match(/^Q\d+\.\s*(.*)/);
     if (qMatch) {
          if (currentQ && currentQ.options.length > 0) {
               questions.push(currentQ);
          }
          currentQ = {
               question: qMatch[1],
               options: [],
               answer: ''
          };
          continue;
     }

     // Detect options
     const optMatch = line.match(/^[A-D]\.\s*(.*)/);
     if (optMatch && currentQ) {
          currentQ.options.push(line); // Keep the 'A. ' part
          continue;
     }

     // Detect answer
     const ansMatch = line.match(/^Answer:\s*(.*)/);
     if (ansMatch && currentQ) {
          // Some answers have a trailing number like "1", remove it if it exists at the end
          let ansText = ansMatch[1].trim();
          ansText = ansText.replace(/\s+\d+$/, '').trim();
          currentQ.answer = ansText;
          continue;
     }

     // If it's none of the above, it could be a continuation of the previous line (e.g. multi-line question or option)
     if (currentQ) {
          if (currentQ.answer) {
               // Already got answer, so this might be extra text, ignore
          } else if (currentQ.options.length > 0) {
               // Continuation of an option maybe?
               // Actually sometimes a question text is on multiple lines before options.
               // If options are empty, it's question text.
               // If options are running, we append to the last option.
               currentQ.options[currentQ.options.length - 1] += ' ' + line;
          } else {
               currentQ.question += ' ' + line;
          }
     }
}

if (currentQ && currentQ.options.length > 0) {
     questions.push(currentQ);
}

fs.writeFileSync('src/data/bmis_qa.json', JSON.stringify(questions, null, 2));
console.log(`Parsed ${questions.length} questions.`);
