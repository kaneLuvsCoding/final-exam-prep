const fs = require('fs');

const rawText = fs.readFileSync('src/data/erp_qa.json', 'utf8');
const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const questions = [];
let currentQ = null;
let currentOpt = null;

// Helper to fix OCR glitches
const fixText = (str) => {
    return str.replace(/com\s*y/g, 'company')
              .replace(/end\s*-\s*users/g, 'end-users')
              .replace(/-\s+/g, '-')
              .replace(/\s+-/g, '-')
              .replace(/\s+/g, ' ')
              .replace(/Flase/g, 'False')
              .trim();
};

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip page headers/numbers or assignments
    if (/^[0-9]+$/.test(line) && line.length < 3) continue;
    if (line.toLowerCase().includes('multiple choice')) continue;
    if (line.toLowerCase() === 'true or false' || line.toLowerCase() === 'true or false questions' || line.toLowerCase() === 'true or false questions.') continue;
    if (line.toLowerCase().startsWith('assignment')) continue;
    if (line.toLowerCase().startsWith('tutorial')) continue;
    if (line.toLowerCase().startsWith('midterm')) continue;
    if (line.toLowerCase().startsWith('select the correct answer')) continue;

    // Is it a question? (starts with a number followed by dot, or we saw "1" previously which we skipped, but wait, Q1 was "1 \n What is...")
    let qMatch = line.match(/^([0-9]+)\.\s*(.*)/);
    
    // special case for the first question which might be split "1 \n What is..."
    if (!qMatch && line.endsWith('?') && !line.match(/^[a-dA-D]\)/)) {
        // Just treat any line ending in ? that isn't an option as a question start if we don't have one
        if (!currentQ || (currentQ && currentQ.options.length > 0)) {
            if (currentQ) {
                if (currentOpt) currentQ.options.push(fixText(currentOpt));
                questions.push(currentQ);
            }
            currentQ = { question: line, options: [], answer: '' };
            currentOpt = null;
            continue;
        }
    }

    if (qMatch) {
        if (currentQ) {
            if (currentOpt) {
                currentQ.options.push(fixText(currentOpt));
            } else if (currentQ.options.length === 0 && (currentQ.question.toLowerCase().endsWith('true') || currentQ.question.toLowerCase().endsWith('false'))) {
                // it was a true/false question handled below maybe
            }
            questions.push(currentQ);
        }
        currentQ = { question: qMatch[2] || '', options: [], answer: '' };
        currentOpt = null;
        continue;
    }

    // Is it an option?
    let optMatch = line.match(/^([a-dA-D])\)\s*(.*)/);
    if (optMatch) {
        if (currentOpt) {
            currentQ.options.push(fixText(currentOpt));
        }
        currentOpt = line; // start collecting option
        continue;
    }

    // Is it a True/False indicator at the end? (Sometimes T/F are hanging on their own line)
    if (currentQ && currentQ.options.length === 0 && !currentOpt) {
        let lLower = line.toLowerCase();
        if (lLower === 'true' || lLower === 'false' || lLower === 'flase') {
             // It's a True/False question
             currentQ.options = ["True", "False"];
             currentQ.answer = lLower === 'true' ? 'True' : 'False';
             continue;
        }
    }

    // Otherwise, it's a continuation of the previous block
    if (currentOpt) {
        currentOpt += ' ' + line;
    } else if (currentQ) {
        currentQ.question += ' ' + line;
    }
}

// Push the very last question
if (currentQ) {
    if (currentOpt) currentQ.options.push(fixText(currentOpt));
    questions.push(currentQ);
}

// Post-processing to clean up True/False answers appended to question text
for (let q of questions) {
    q.question = fixText(q.question);
    
    // Check if True/False is appended at the end of the question text
    let qLower = q.question.toLowerCase();
    if (qLower.endsWith(' true') || qLower.endsWith(' false') || qLower.endsWith(' flase')) {
        let match = q.question.match(/(.*)\s+(True|False|Flase)$/i);
        if (match) {
            q.question = match[1].trim();
            q.options = ["True", "False"];
            q.answer = match[2].toLowerCase() === 'true' ? 'True' : 'False';
            q.question += "?"; // usually true/false don't have question marks, just add it or leave it
        }
    }
    
    // Ensure all MCQs have basic formatting mapping
    if (q.options.length === 0 && !q.answer) {
         // Some weird parsed state?
    }
    
    // Capitalize options A. B. C. D. for consistency with BMIS
    q.options = q.options.map(opt => {
         let mm = opt.match(/^([a-dA-D])\)\s*(.*)/);
         if (mm) {
              return mm[1].toUpperCase() + ". " + mm[2];
         }
         return opt;
    });
}

// Save back
fs.writeFileSync('src/data/erp_qa.json', JSON.stringify(questions, null, 2));
console.log(`Parsed ${questions.length} questions.`);
