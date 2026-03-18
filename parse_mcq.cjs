const fs = require('fs');
const PDFParser = require("pdf2json");

const pdfParser = new PDFParser(this, 1);
pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync("./mcq_text.txt", pdfParser.getRawTextContent());
    console.log("MCQ Done");
});
pdfParser.loadPDF("./public/MCQ (sample _answer).docx.pdf");
