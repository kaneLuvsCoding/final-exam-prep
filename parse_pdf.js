const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('./public/Q&A.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('./pdf_text.txt', data.text);
    console.log("PDF parsed successfully.");
}).catch(function(error){
    console.error("Error:", error);
});
