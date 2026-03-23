// Script to bulk-insert SQM 2-Marks questions into Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hnexayyduetnbovqlvlc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_utdkU9uyrxIJqII6pve_Sg_PczwvhEp';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const questions = [
  {
    question: "Uniqueness of software development process.",
    answer: "• High complexity, as compared to other industrial products\n• Invisibility of the product\n• Opportunities to detect defects ("bugs") are limited to the product development phase"
  },
  {
    question: "Software quality.",
    answer: "(IEEE) The degree to which a system, component, or process meets specified requirements. The degree to which a system, component, or process meets customer or user needs or expectations.\n(Pressman) Conformance to explicitly stated functional and performance requirements. Explicitly documented development standards. Implicit characteristics that are expected of all professionally developed software."
  },
  {
    question: "Software Quality Assurance.",
    answer: "• Activities that ensure the implementation of processes, procedures, and standards.\n• Focuses on processes and procedures rather than conducting actual testing.\n• Process-oriented activities.\n• Known as Preventive activities.\n• A subset of Software Test Life Cycle (STLC)."
  },
  {
    question: "Quality Control (QC).",
    answer: "• Activities that ensure the verification of developed software.\n• Focuses on actual testing by executing the software.\n• Product-oriented activities.\n• Corrective activities.\n• QC can be considered as the subset of Quality Assurance."
  },
  {
    question: "Software Testing.",
    answer: "• The process of evaluating a system\n• To find whether it satisfies the specified requirements or not\n• Executing a system to identify any gaps, errors to the actual desire"
  },
  {
    question: "CMM.",
    answer: "• Stands for Capability Maturity Model\n• A method to evaluate and measure the maturity of the software development process\n• Developed by Carnegie Mellon Uni's Software Engineering Institute (SEI)\n• Similar to ISO 9001, one of the ISO 9000 series of standards"
  },
  {
    question: "Disadvantages of CMMI model.",
    answer: "• May require additional resources and knowledge to initiate CMMI based process improvement.\n• May require considerable amount of time and effort for implementation."
  },
  {
    question: "Requirements documents.",
    answer: "A project will be carried out according to two requirements documents:\n• Client's requirements document\n• Developer's additional requirements document"
  },
  {
    question: "Stubs and drivers.",
    answer: "• A stub replaces an unavailable lower level module, subordinate to the module tested. Stubs are required for top-down testing of incomplete systems. The stub provides the results of calculations the subordinate module.\n• A driver is a substitute module. The driver is passing the test data on to the tested module. Accepting the results calculated by it. Drivers are required in bottom-up testing until the upper level modules are developed."
  },
  {
    question: "Data Driven Testing.",
    answer: "For testing application functions where the same functions need to be validated with lots of different inputs and large data sets."
  },
  {
    question: "Regression Testing.",
    answer: "Automated testing is suitable because of frequent code changes and the ability to run the regressions in a timely manner."
  },
  {
    question: "Incremental Testing.",
    answer: "• Test incrementally.\n• Test the software in modules (unit tests).\n• Test groups of units integrated with new components (integration tests).\n• Repeat until the complete software is done and test again (system tests)."
  },
  {
    question: "Top-down Testing.",
    answer: "• Testing takes place from top to bottom, following the control flow.\n• Components or systems are substituted by stubs.\n• The first module tested is the main module.\n• The lowest level modules are tested last."
  },
  {
    question: "Bottom-up Testing.",
    answer: "• Testing takes place from the bottom of the control flow upwards.\n• Components or systems are substituted by drivers.\n• The lowest level modules are tested first.\n• Main module is tested last."
  },
  {
    question: "Usability testing.",
    answer: "• An area needed to measure how user-friendly, efficient, or convenient the software is for the end users.\n• Human observation is the most important factor.\n• Manual approach is preferable."
  },
  {
    question: "Root causes of software errors.",
    answer: "Usually considered the root cause of software errors:\n• Incorrect requirement: Simply stated, 'wrong' definitions\n• Incomplete: Unclear or implied requirements\n• Missing requirements: Just flat-out 'missing'\n• Inclusion of unneeded: Impacts budgets, complexity, development time"
  },
  {
    question: "Documentation errors.",
    answer: "• Errors in the design documents\n• Errors in the documentation in the User Manuals, Operators Manual, other manuals\n• Errors in on-line help, if available\n• Listing of non-existing software functions\n• Many error messages are totally meaningless"
  },
  {
    question: "Software development standards and procedures.",
    answer: "Software development STANDARD:\n• ISO\n• CMMI\nSoftware Development PROCEDURE:\n• Processes\n• Tasks\n• WBS: Work Breakdown Structure"
  },
  {
    question: "Element of quality plan.",
    answer: "• List of quality goals\n• Review activities\n• Software tests\n• Acceptance tests for software externally developed\n• Configuration management tools and procedures"
  },
  {
    question: "Review Activities.",
    answer: "The quality plan should provide a complete listing of all planned review activities:\n• Design reviews (DRs)\n• Design inspections\n• Code inspections"
  },
  {
    question: "The criteria are needed in development and quality plans for small projects and internal projects.",
    answer: "The Development plan:\n• Estimates of project costs\n• Development risks\n• Project benchmarks\n• Project products, indicating "deliverables"\nThe quality plan:\n• Quality goals"
  },
  {
    question: "Software Development Risks.",
    answer: "• Scheduling and timing risks\n• System functionality risks\n• Subcontracting risks\n• Requirement management risks\n• Resource usage and performance risks\n• Personnel management risks"
  },
  {
    question: "CASE.",
    answer: "CASE stands for Computer Aided Software Engineering. It means development and maintenance of software projects with help of various automated software tools. CASE tools stands for computerized software development tool."
  },
  {
    question: "CASE Tools.",
    answer: "CASE tools stands for computerized software development tool.\n• Support the developer when performing one or more phases of the software life cycle\n• Support software maintenance\n• Classic CASE tools: Interactive debuggers, compilers, project progress control systems\n• Real CASE tools: Support several phases of development"
  },
  {
    question: "The review process.",
    answer: '"A process or meeting during which a work product or set of work products is presented to project personnel, managers, users, customers, or other interested parties for comment or approval." (IEEE) Essential to detect/correct errors in these earlier work products because the cost of errors downstream is very expensive!'
  },
  {
    question: "Indirect objectives of the review.",
    answer: "Indirect objectives - are more general in nature:\n• To provide an informal meeting place for exchange of professional knowledge about methods, tools and techniques.\n• To record analysis and design errors that will serve as a basis for future corrective actions."
  },
  {
    question: "Direct objectives of the review.",
    answer: "Direct objectives - Deal with the current project:\n• To detect analysis and design errors\n• To identify new risks\n• To locate deviations from templates\n• To approve the analysis or design product\nApproval allows the team to continue on to the next development phase."
  },
  {
    question: "Inspection.",
    answer: "• Emphasize the objective of corrective action, more formal\n• Look to improve methods as well\n• Consider to contribute more to general level of SQA"
  },
  {
    question: "Post-Review Activities.",
    answer: "• Prepare the review report, including the action items.\n• Establish follow-up to ensure the satisfactory performance of all the corrections included in the list of action items."
  }
];

async function main() {
  // 1. Find SQM subject ID
  const { data: subjects, error: subErr } = await supabase
    .from('subjects')
    .select('id, name')
    .ilike('name', 'SQM');

  if (subErr || !subjects || subjects.length === 0) {
    console.error('Could not find SQM subject:', subErr?.message || 'Not found');
    // Try broader search
    const { data: allSubs } = await supabase.from('subjects').select('id, name');
    console.log('Available subjects:', allSubs?.map(s => s.name));
    return;
  }

  const subjectId = subjects[0].id;
  console.log(`Found SQM subject: id=${subjectId}`);

  // 2. Find "2 marks" topic ID
  const { data: topics, error: topErr } = await supabase
    .from('topics')
    .select('id, name')
    .eq('subject_id', subjectId);

  if (topErr || !topics) {
    console.error('Could not fetch topics:', topErr?.message);
    return;
  }

  console.log('Available topics:', topics.map(t => t.name));

  const twoMarksTopic = topics.find(t => t.name.toLowerCase().includes('2') || t.name.toLowerCase().includes('two'));
  if (!twoMarksTopic) {
    console.error('Could not find "2 marks" topic. Available:', topics.map(t => t.name));
    return;
  }

  const topicId = twoMarksTopic.id;
  console.log(`Found 2 marks topic: "${twoMarksTopic.name}" id=${topicId}`);

  // 3. Get semester_id (we need it for the insert)
  // Fetch a sample question to see what fields are required
  const { data: sampleQ } = await supabase
    .from('questions')
    .select('*, subjects(name), topics(name)')
    .eq('subject_id', subjectId)
    .limit(1);

  console.log('Sample question structure:', JSON.stringify(sampleQ?.[0], null, 2));

  // 4. Insert questions one by one
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const payload = {
      question: q.question,
      answer: q.answer,
      type: 'normal',
      subject_id: subjectId,
      topic_id: topicId,
    };

    const { data, error } = await supabase
      .from('questions')
      .insert([payload])
      .select();

    if (error) {
      console.error(`Failed Q${i + 1} "${q.question.substring(0, 40)}...":`, error.message);
      // Try without answer to see what fields are required   
      if (error.message.includes('semester_id') || error.message.includes('null')) {
        console.log('Payload that failed:', JSON.stringify(payload));
      }
      failCount++;
    } else {
      console.log(`✓ Q${i + 1} inserted (id=${data[0]?.id})`);
      successCount++;
    }
  }

  console.log(`\nDone! ${successCount} inserted, ${failCount} failed.`);
}

main().catch(console.error);
