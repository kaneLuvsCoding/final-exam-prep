const fs = require('fs');

const text = fs.readFileSync('pdf_text.txt', 'utf8');

const blocks = text.split(/Question \d+/i);
const questions = [];

for (let i = 1; i < blocks.length; i++) {
    let block = blocks[i];
    
    // Clean up unwanted Moodle text
    block = block.replace(/----------------Page \(\d+\) Break----------------/g, '');
    block = block.replace(/Incorrect|Correct/g, '');
    block = block.replace(/Mark \d+\.\d+ out of \d+\.\d+/g, '');
    block = block.replace(/Flag question/g, '');
    block = block.replace(/Question text/g, '');
    
    // Extract the correct answer
    const answerMatch = block.match(/The correct answer is: (.*)/);
    let answer = answerMatch ? answerMatch[1].trim() : '';
    
    // Remove the feedback part entirely to isolate the question and options
    block = block.split('Feedback')[0];
    
    // Split by options: a., b., c., d.
    // The options are usually formatted as a. \n [text] \n b. \n [text]
    const optionMatches = block.split(/(?:\n|^)(a\.|b\.|c\.|d\.)\s*\n/);
    
    if (optionMatches.length >= 9) {
        // optionMatches[0] is the question text
        let questionText = optionMatches[0].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
        
        let options = [];
        for (let j = 1; j < optionMatches.length; j += 2) {
            let optLetter = optionMatches[j].trim();
            let optText = optionMatches[j+1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
            options.push(optLetter + " " + optText);
        }
        
        questions.push({
            question: questionText,
            options: options,
            answer: answer
        });
    } else {
        // Fallback simple parsing just in case
        let lines = block.split('\n').map(l => l.trim()).filter(l => l);
        let qLines = [];
        let opts = [];
        let currentOpt = '';
        
        for (let line of lines) {
            if (/^[a-d]\.$/.test(line)) {
                if (currentOpt) opts.push(currentOpt);
                currentOpt = line;
            } else if (currentOpt) {
                currentOpt += " " + line;
            } else {
                qLines.push(line);
            }
        }
        if (currentOpt) opts.push(currentOpt);
        
        if (opts.length > 0) {
            questions.push({
                question: qLines.join(' ').replace(/\s+/g, ' '),
                options: opts.map(o => o.replace(/\s+/g, ' ')),
                answer: answer
            });
        }
    }
}

fs.writeFileSync('analysis_qa.json', JSON.stringify(questions, null, 2));
console.log(`Parsed ${questions.length} questions.`);
