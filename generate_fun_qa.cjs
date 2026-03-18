const fs = require('fs');

const mcqs = [
    {
        type: "mcq",
        question: "The time interval on the leading edge of a pulse between 10% and 90% of the amplitude is the",
        options: ["A. rise time", "B. fall time", "C. pulse width", "D. period"],
        answer: "A. rise time"
    },
    {
        type: "mcq",
        question: "The binary number 10001101010001101111 can be written in hexadecimal as",
        options: ["A. AD467", "B. 8C46F", "C. 8D46F", "D. AE46F"],
        answer: "C. 8D46F"
    },
    {
        type: "mcq",
        question: "The fractional binary number 0.11 has a decimal value of",
        options: ["A. 1/4", "B. 1/2", "C. 3/4", "D. none of the above"],
        answer: "C. 3/4"
    },
    {
        type: "mcq",
        question: "The binary number 101100111001010100001 can be written in octal as",
        options: ["A. 5471230", "B. 5471241", "C. 2634521", "D. 23162501"],
        answer: "B. 5471241"
    },
    {
        type: "mcq",
        question: "The addition of hexadecimal A0 + 6B is",
        options: ["A. 1FB", "B. 10B", "C. 0B", "D. 1AB"],
        answer: "B. 10B"
    },
    {
        type: "mcq",
        question: "According to the associative law of multiplication,",
        options: ["A. A+ (B+C) = (A+B) + C", "B. A(BC) = (AB)C", "C. AB = BA", "D. A(B+C) = AB +AC"],
        answer: "B. A(BC) = (AB)C"
    },
    {
        type: "mcq",
        question: "A BCD-to-7 segment decoder has 0100 on its inputs. The active outputs are",
        options: ["A. a, b, f, g", "B. b, c, f, g", "C. b, c, e, f", "D. b, d, e, g"],
        answer: "B. b, c, f, g"
    },
    {
        type: "mcq",
        question: "The logical sum of two or more logical product term is called",
        options: ["A. POS", "B. SOP", "C. OR operation", "D. NAND operation"],
        answer: "B. SOP"
    },
    {
        type: "mcq",
        question: "The AND operation can be produced with",
        options: ["A. three NAND gates", "B. four NAND gates", "C. two NOR gates", "D. three NOR gates"],
        answer: "D. three NOR gates"
    },
    {
        type: "mcq",
        question: "A full adder is characterized by",
        options: ["A. two inputs and two outputs", "B. three inputs and two outputs", "C. two inputs and three outputs", "D. two inputs and one output"],
        answer: "B. three inputs and two outputs"
    },
    {
        type: "mcq",
        question: "If an octal-to-binary priority encoder has its 0,2,5 and 6 inputs at the active level, the active HIGH binary output is",
        options: ["A. 0110", "B. 010", "C. 0000", "D. 110"],
        answer: "D. 110" 
    },
    {
        type: "mcq",
        question: "If a 74HC85 magnitude comparator has A = 1011 and B = 1001 on its inputs, the outputs are",
        options: ["A. A > B = 0, A < B = 1, A = B = 0", "B. A > B = 1, A < B = 0, A = B = 0", "C. A > B = 1, A < B = 1, A = B = 0", "D. A > B = 0, A < B = 0, A = B = 1"],
        answer: "B. A > B = 1, A < B = 0, A = B = 0"
    },
    {
        type: "mcq",
        question: "Which inputs directly control the selection of the data input that is routed to the output in a multiplexer?",
        options: ["A. Data inputs", "B. Output signal", "C. Data select inputs", "D. Enable line"],
        answer: "C. Data select inputs"
    },
    {
        type: "mcq",
        question: "When toggle condition occurs in JK flip flop?",
        options: ["A. J=1, K=1", "B. J=0, K=0", "C. J=1, K=0", "D. J=0, K=1"],
        answer: "A. J=1, K=1"
    },
    {
        type: "mcq",
        question: "How many flip-flops are required to construct a decade counter?",
        options: ["A. 4", "B. 8", "C. 5", "D. 10"],
        answer: "A. 4" 
    },
    {
        type: "mcq",
        question: "For a gated D latch, the Q output always equals the D input",
        options: ["A. before the enable pulse", "B. during the enable pulse", "C. immediately after the enable pulse", "D. both B and C"],
        answer: "D. both B and C"
    },
    {
        type: "mcq",
        question: "The terminal count of a typical modulus-10 binary counter is",
        options: ["A. 0000", "B. 1010", "C. 1001", "D. 1111"],
        answer: "C. 1001"
    },
    {
        type: "mcq",
        question: "How many different states does a 3-bit asynchronous counter have?",
        options: ["A. 2", "B. 4", "C. 8", "D. 16"],
        answer: "C. 8"
    },
    {
        type: "mcq",
        question: "A shift register is a digital circuit that",
        options: ["A. stores data.", "B. shifts the data from left to right", "C. shifts the data from right to left", "D. all of the above"],
        answer: "D. all of the above"
    },
    {
        type: "mcq",
        question: "To serially shift a byte of data into a shift register, there must be",
        options: ["A. one clock pulse", "B. one load pulse", "C. eight clock pulses", "D. one clock pulse for each 1 in the data"],
        answer: "C. eight clock pulses"
    }
];

const fitbs = [
    {
        type: "fitb",
        question: "A _________ quantity is one having a discrete set of values.",
        answer: "digital",
        acceptableAnswers: ["digital"],
        options: [] 
    },
    {
        type: "fitb",
        question: "In a 3-variable Karnaugh map, a 2-variable product term is produced by a _________ cell group of 1s.",
        answer: "2",
        acceptableAnswers: ["2", "two"],
        options: []
    },
    {
        type: "fitb",
        question: "A 4-bit binary counter has a maximum modulus of _________",
        answer: "16",
        acceptableAnswers: ["16", "sixteen"],
        options: []
    },
    {
        type: "fitb",
        question: "If the output of a gate is OFF when the inputs are the same, and ON when they are different, the gate must be an _________ gate.",
        answer: "XOR",
        acceptableAnswers: ["XOR", "exclusive-or", "exclusive or"],
        options: [] 
    },
    {
        type: "fitb",
        question: "A two-input OR gate can be produced by using _________ number of two-input NAND gates.",
        answer: "3", 
        acceptableAnswers: ["3", "three"],
        options: []
    },
    {
        type: "fitb",
        question: "If a 74HC85 magnitude comparator has A = 1000 and B = 1010, the active output is _________.",
        answer: "A < B",
        acceptableAnswers: ["A < B", "A<B", "A<B=1"],
        options: []
    },
    {
        type: "fitb",
        question: "Flip-flops and latches are both _________ devices.",
        answer: "bistable",
        acceptableAnswers: ["bistable", "memory", "sequential"],
        options: []
    },
    {
        type: "fitb",
        question: "The handling of all numerical operations in a computer is done by _________ unit.",
        answer: "ALU", 
        acceptableAnswers: ["ALU", "arithmetic logic", "arithmetic logic unit"],
        options: []
    },
    {
        type: "fitb",
        question: "If an octal-to-binary priority encoder has its 0, 2, 5, and 6 inputs at the active level, the active HIGH binary output is _________.",
        answer: "110",
        acceptableAnswers: ["110"],
        options: []
    },
    {
        type: "fitb",
        question: "An encoder essentially performs a reverse _________ function.",
        answer: "decoder",
        acceptableAnswers: ["decoder", "decoding"],
        options: []
    },
    {
        type: "fitb",
        question: "The burglar alarm will sound if either the door or the window or both are opened. This is an example of _________ type of logic gate.",
        answer: "OR",
        acceptableAnswers: ["OR"],
        options: []
    },
    {
        type: "fitb",
        question: "Solving -11 + (-2) will yield the 8-bit number in the 2’s complement answer of _________.",
        answer: "11110011",
        acceptableAnswers: ["11110011"],
        options: []
    },
    {
        type: "fitb",
        question: "The minimum number of flip-flops that can be used to construct a modulus-5 counter is _________.",
        answer: "3",
        acceptableAnswers: ["3", "three"],
        options: []
    },
    {
        type: "fitb",
        question: "When both the J and K inputs are _________, an edge-triggered J-K flip-flop changes state on each clock pulse.",
        answer: "HIGH",
        acceptableAnswers: ["HIGH", "1"],
        options: []
    },
    {
        type: "fitb",
        question: "Multiplication in Boolean algebra is equivalent to the _________ function.",
        answer: "AND",
        acceptableAnswers: ["AND"],
        options: []
    }
];

const total = [...mcqs, ...fitbs];
fs.writeFileSync('src/data/fundamental_qa.json', JSON.stringify(total, null, 2));
console.log('Created fundamental_qa.json');
