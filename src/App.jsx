import React, { useState, useEffect, useRef } from 'react';
import { studyData } from './data/index';
import AccordionItem from './components/AccordionItem';

// Exam schedule with times set to midnight (00:00:00) on the exam day
const examSchedule = {
  "Technical Writing": "2026-03-17T00:00:00",
  "Analysis of Algorithm": "2026-03-18T00:00:00",
  "BMIS": "2026-03-19T00:00:00",
  "ERP System": "2026-03-20T00:00:00",
  "Advanced DBMS": "2026-03-23T00:00:00",
  "SQM": "2026-03-24T00:00:00"
};

export default function StudyHub() {
  const subjects = Object.keys(studyData).sort((a, b) => {
    const dateA = new Date(examSchedule[a] || "2099-01-01").getTime();
    const dateB = new Date(examSchedule[b] || "2099-01-01").getTime();
    return dateA - dateB;
  });

  const [activeSubject, setActiveSubject] = useState(subjects[0]);
  
  // Check if the current subject is a PDF document instead of flashcards
  const subjectData = studyData[activeSubject];
  const isDocument = subjectData?.type === "document";
  
  // Tab State (Only generate tabs if it's NOT a document)
  const tabs = isDocument ? [] : Object.keys(subjectData || {});
  const [activeTab, setActiveTab] = useState(tabs[0] || "");
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);

  // Timer State
  const [now, setNow] = useState(new Date());

  // Audio Reference
  const popAudio = useRef(typeof Audio !== "undefined" ? new Audio('/pop.mp3') : null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset tabs when changing subjects
  useEffect(() => {
    if (!isDocument) {
      const newTabs = Object.keys(studyData[activeSubject] || {});
      setActiveTab(newTabs.length > 0 ? newTabs[0] : "");
    }
    setOpenQuestionIndex(null);
  }, [activeSubject, isDocument]);

  const handleToggleQuestion = (index) => {
    setOpenQuestionIndex(openQuestionIndex === index ? null : index);
  };

  const playSound = () => {
    if (popAudio.current) {
      popAudio.current.currentTime = 0;
      popAudio.current.play().catch(e => console.log("Audio play failed", e));
    }
  };

  const getCountdown = (subject) => {
    const dateString = examSchedule[subject];
    if (!dateString) return "?";

    const examDate = new Date(dateString);
    const diffTime = examDate - now;

    if (diffTime <= 0) return "EXAM DAY!";

    const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
    const m = Math.floor((diffTime / 1000 / 60) % 60);
    const s = Math.floor((diffTime / 1000) % 60);

    const hStr = totalHours.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    return `${hStr}h ${mStr}m ${sStr}s`;
  };

  const currentQAs = isDocument ? [] : (subjectData?.[activeTab] || []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      
      {/* Top Navbar */}
      <header className="bg-indigo-700 text-white shadow-md z-20">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Finals Prep Hub
          </h1>
          <nav className="flex gap-2 overflow-x-auto">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 whitespace-nowrap ${
                  activeSubject === subject 
                    ? 'bg-white text-indigo-700 shadow-sm' 
                    : 'bg-indigo-600 text-indigo-100 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                {subject}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-full md:w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-2 shadow-sm z-10 overflow-y-auto hidden md:flex">
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              {activeSubject} Topics
            </h2>
          </div>
          
          {/* Conditional Rendering: PDF Viewer OR Flashcards */}
          {isDocument ? (
              <div className="flex-1 min-h-[600px] w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <iframe 
                  src={subjectData.file} 
                  className="w-full h-full"
                  title={`${activeSubject} PDF Notes`}
                />
              </div>
            ) : (
            <nav className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setOpenQuestionIndex(null);
                  }}
                  className={`text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
              {tabs.length === 0 && (
                <p className="text-sm text-slate-400 italic">No topics added yet.</p>
              )}
            </nav>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <div className="max-w-5xl mx-auto h-full flex flex-col">
            <header className="mb-10 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800">
                  {isDocument ? "Visual Study Guide" : (activeTab || "No Data")}
                </h2>
                <p className="text-slate-500 mt-2 text-lg">
                  {isDocument ? subjectData.message : "Click to reveal the notes. Try to answer in your head first!"}
                </p>
              </div>
              
              {/* Clickable Countdown Badge */}
              <div 
                onClick={playSound}
                className="bg-rose-50 border border-rose-200 text-rose-600 px-5 py-3 rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0 ml-4 font-mono min-w-[12rem] cursor-pointer hover:bg-rose-100 active:scale-95 transition-all select-none"
              >
                <span className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1 font-sans">
                  Exam In
                </span>
                <span className="text-xl md:text-2xl font-black leading-none tracking-tight">
                  {getCountdown(activeSubject)}
                </span>
              </div>
            </header>
            
            {/* Conditional Rendering: PDF Viewer OR Flashcards */}
            {isDocument ? (
              <div className="flex-1 min-h-[600px] w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <iframe 
                  src={subjectData.file} 
                  className="w-full h-full"
                  title={`${activeSubject} PDF Notes`}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {currentQAs.map((qa, index) => (
                  <AccordionItem
                    key={index}
                    question={qa.question}
                    answer={qa.answer}
                    isOpen={openQuestionIndex === index}
                    onClick={() => handleToggleQuestion(index)}
                  />
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}