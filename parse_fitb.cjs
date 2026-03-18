const fs = require('fs');
const PDFParser = require("pdf2json");

const pdfParser = new PDFParser(this, 1);
pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync("./fitb_text.txt", pdfParser.getRawTextContent());
    console.log("FITB Done");
});
pdfParser.loadPDF("./public/Fill in the blanks (sample)(1).docx.pdf");
