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
  
  const subjectData = studyData[activeSubject];
  const isDocument = subjectData?.type === "document";
  
  const tabs = isDocument ? [] : Object.keys(subjectData || {});
  const [activeTab, setActiveTab] = useState(tabs[0] || "");
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [now, setNow] = useState(new Date());
  const popAudio = useRef(typeof Audio !== "undefined" ? new Audio('/pop.mp3') : null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isDocument) {
      const newTabs = Object.keys(studyData[activeSubject] || {});
      setActiveTab(newTabs.length > 0 ? newTabs[0] : "");
    }
    setOpenQuestionIndex(null);
    setIsMobileMenuOpen(false); 
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
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      
      {/* Top Navbar */}
      <header className="bg-indigo-700 text-white shadow-md z-40 shrink-0">
        <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between shrink-0">
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              Finals Prep Hub
            </h1>
            
            {/* Mobile Hamburger Button */}
            <button 
              className="md:hidden p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Swipeable Subjects Nav */}
          <nav className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide snap-x w-full md:justify-end">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={`px-4 md:px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 whitespace-nowrap snap-start shrink-0 ${
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
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Overlay Background */}
        {isMobileMenuOpen && (
          <div 
            className="absolute inset-0 bg-slate-900/40 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar (Topics) - Drawer on Mobile, Fixed Column on Desktop */}
        <aside className={`absolute md:relative w-[80%] md:w-72 h-full bg-white border-r border-slate-200 flex flex-col shadow-2xl md:shadow-none z-30 transition-transform duration-300 ease-in-out shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="p-6 h-full flex flex-col overflow-y-auto">
            <div className="mb-6 flex justify-between items-center shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {activeSubject} Topics
              </h2>
            </div>
            
            {isDocument ? (
               <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 text-center mt-4">
                 <div className="text-3xl mb-2">📊</div>
                 <p className="text-indigo-800 font-bold mb-1">Document Mode</p>
                 <p className="text-indigo-600 text-sm leading-relaxed">Flashcards are disabled for this visual study guide.</p>
               </div>
            ) : (
              <nav className="flex flex-col gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setOpenQuestionIndex(null);
                      setIsMobileMenuOpen(false); 
                    }}
                    className={`text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === tab 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm ring-1 ring-indigo-200/50' 
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
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full bg-slate-50">
          <div className={`mx-auto p-4 md:p-10 lg:p-12 ${isDocument ? 'max-w-6xl' : 'max-w-4xl'}`}>
            
            {/* Header: Stacks on mobile, clean row on desktop */}
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0 border-b border-slate-200/60 pb-8">
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                  {isDocument ? "Visual Study Guide" : (activeTab || "Select a Topic")}
                </h2>
                <p className="text-slate-500 mt-2 text-base md:text-lg">
                  {isDocument ? subjectData.message : "Click to reveal the notes. Try to answer in your head first!"}
                </p>
              </div>
              
              {/* Live Countdown Badge */}
              <div 
                onClick={playSound}
                className="bg-white border-2 border-rose-100 text-rose-600 px-6 py-4 rounded-2xl flex flex-col items-center justify-center shadow-sm w-full md:w-auto md:min-w-[14rem] cursor-pointer hover:bg-rose-50 hover:border-rose-200 active:scale-95 transition-all select-none group"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-1 font-sans group-hover:text-rose-500 transition-colors">
                  Exam In
                </span>
                <span className="text-2xl md:text-3xl font-black leading-none tracking-tight font-mono">
                  {getCountdown(activeSubject)}
                </span>
              </div>
            </header>
            
            {/* Conditional Rendering: PDF Viewer OR Flashcards */}
            {isDocument ? (
              <div className="w-full bg-slate-200 rounded-2xl shadow-sm border border-slate-300 overflow-hidden flex flex-col h-[calc(100vh-16rem)] min-h-[500px]">
                <object 
                  data={subjectData.file} 
                  type="application/pdf" 
                  className="w-full h-full flex-1"
                >
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white">
                    <div className="text-5xl mb-4">📄</div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">PDF Viewer Blocked</h3>
                    <p className="text-slate-500 mb-8 max-w-md text-base">
                      Your browser doesn't support embedded PDFs, or the file couldn't be found.
                    </p>
                    <a 
                      href={subjectData.file} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      Open PDF in New Tab
                    </a>
                  </div>
                </object>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
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