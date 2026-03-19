const fs = require('fs');

const rawAnswers = "c,b,b,b,b,b,b,b,b,b,b,b,c,b,b,c,b,b,b,b,b,c,b,c,b,b,b,b,b,b,b,b,b,b,b,c,b,b,b,b,b,a,c,b,b,b,b,b,b,c,b,a,b,b,b,c,b,b,b,b,b,b,b,b,b,b,b,b,d,b,a,b,b".split(',');

let data = JSON.parse(fs.readFileSync('src/data/erp_qa.json', 'utf8'));
let mcqCount = 0;
let tfCount = 0;

for (let i = 0; i < data.length; i++) {
    let q = data[i];
    if (q.options.length === 2 && q.options.includes("True") && q.options.includes("False")) {
        tfCount++;
    } else {
        mcqCount++;
    }
}

console.log(`Total questions: ${data.length}`);
console.log(`MCQ count: ${mcqCount}`);
console.log(`T/F count: ${tfCount}`);
console.log(`Answers provided: ${rawAnswers.length}`);

// Apply answers
let ansIdx = 0;
for (let i = 0; i < data.length; i++) {
    let q = data[i];
    if (q.options.length === 2 && q.options.includes("True") && q.options.includes("False")) {
        continue;
    }
    
    if (ansIdx < rawAnswers.length) {
        let expectedLetter = rawAnswers[ansIdx].toUpperCase();
        ansIdx++;
        let correctOpt = q.options.find(opt => opt.startsWith(expectedLetter + "."));
        if (!correctOpt) {
            console.log(`Warning: for question index ${i} ("${q.question.substring(0, 30)}..."), could not find option ${expectedLetter}`);
            // default to just placing the letter
            q.answer = expectedLetter + ".";
        } else {
            q.answer = correctOpt;
        }
    } else {
        console.log(`Warning: Ran out of answers at question index ${i}`);
    }
}

fs.writeFileSync('src/data/erp_qa.json', JSON.stringify(data, null, 2));
console.log('Applied answers successfully.');
