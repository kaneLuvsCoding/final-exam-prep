import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import QuestionFormModal from './QuestionFormModal';
import AccordionItem from '../components/AccordionItem';

const examSchedule = {
  "Technical Writing": "2026-03-17T00:00:00",
  "Analysis of Algorithm": "2026-03-18T00:00:00",
  "BMIS": "2026-03-19T00:00:00",
  "ERP": "2026-03-20T00:00:00", 
  "Advanced DBMS": "2026-03-23T00:00:00",
  "SQM": "2026-03-24T00:00:00"
};

export default function QuestionsManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Layout states from StudentApp
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768; // Default open on desktop
  });
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  // Data states
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  
  // Selection
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeTopicId, setActiveTopicId] = useState(null);

  // Inline Editing States for Subjects
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [inlineSubjectName, setInlineSubjectName] = useState('');

  // Inline Editing States for Topics
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [inlineTopicName, setInlineTopicName] = useState('');

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name').order('id');
    if (data) {
      setAvailableSubjects(data);
      if (!activeSubjectId && data.length > 0) {
        // Find best initial subject sorted by exam schedule
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(examSchedule[a.name] || "2099-01-01").getTime();
          const dateB = new Date(examSchedule[b.name] || "2099-01-01").getTime();
          return dateA - dateB;
        });
        setActiveSubjectId(sorted[0].id);
      }
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchTopics = async (subjectId) => {
    if (!subjectId) {
      setAvailableTopics([]);
      return;
    }
    const { data } = await supabase
      .from('topics')
      .select('id, name')
      .eq('subject_id', subjectId)
      .order('id');
    if (data) {
      setAvailableTopics(data);
      // Auto-select first topic if topics exist and none selected
      if (data.length > 0) {
          setActiveTopicId(data[0].id);
      } else {
          setActiveTopicId(null);
      }
    }
  };

  useEffect(() => {
    if (activeSubjectId) {
      fetchTopics(activeSubjectId);
    }
  }, [activeSubjectId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('questions')
        .select('*, subjects!inner(name), topics!inner(name), answers(*)')
        .order('id', { ascending: true });

      if (activeSubjectId) {
        query = query.eq('subject_id', activeSubjectId);
      }
      if (activeTopicId) {
        query = query.eq('topic_id', activeTopicId);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setQuestions(data || []);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    setOpenQuestionIndex(null);
  }, [activeSubjectId, activeTopicId]);

  // Derived Values
  const subjectsSorted = [...availableSubjects].sort((a, b) => {
    const dateA = new Date(examSchedule[a.name] || "2099-01-01").getTime();
    const dateB = new Date(examSchedule[b.name] || "2099-01-01").getTime();
    return dateA - dateB;
  });

  const activeSubjectObj = availableSubjects.find(s => s.id === activeSubjectId) || subjectsSorted[0];
  const activeSubjectName = activeSubjectObj ? activeSubjectObj.name : "Select a Subject";
  
  const activeTopicObj = availableTopics.find(t => t.id === activeTopicId) || availableTopics[0];
  const activeTopicName = activeTopicObj ? activeTopicObj.name : "General/No Topic";

  const topActionButtonClass = "inline-flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/15 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40";

  // Actions
  const handleToggleQuestion = (index) => {
    setOpenQuestionIndex(openQuestionIndex === index ? null : index);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      setLoading(true);
      const { error: deleteError } = await supabase.from('questions').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const openEditModal = (question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  // Inline Subject Actions
  const handleAddSubjectClick = () => { setInlineSubjectName(''); setIsAddingSubject(true); setIsEditingSubject(false); };
  const handleEditSubjectClick = (s) => { setInlineSubjectName(s.name); setIsEditingSubject(true); setIsAddingSubject(false); setActiveSubjectId(s.id); };
  const cancelInlineAction = () => { setIsAddingSubject(false); setIsEditingSubject(false); setInlineSubjectName(''); };
  
  const handleDeleteSubjectClick = async (s) => {
    if (window.confirm(`Delete the subject "${s.name}"? This action cannot be undone.`)) {
      const { error } = await supabase.from('subjects').delete().eq('id', s.id);
      if (!error) {
        if (activeSubjectId === s.id) setActiveSubjectId(null);
        await fetchSubjects();
      } else alert("Failed to delete subject: " + error.message);
    }
  };

  const saveInlineSubject = async () => {
    const trimmed = inlineSubjectName.trim();
    if (!trimmed) { cancelInlineAction(); return; }

    if (isAddingSubject) {
      const { data, error } = await supabase.from('subjects').insert([{ name: trimmed }]).select();
      if (!error && data && data[0]) {
        await fetchSubjects();
        setActiveSubjectId(data[0].id);
      } else alert("Failed to add subject: " + error.message);
    } else if (isEditingSubject && activeSubjectId) {
      const { error } = await supabase.from('subjects').update({ name: trimmed }).eq('id', activeSubjectId);
      if (!error) await fetchSubjects();
      else alert("Failed to edit subject: " + error.message);
    }
    cancelInlineAction();
  };

  // Inline Topic Actions
  const handleAddTopicClick = () => { setInlineTopicName(''); setIsAddingTopic(true); setIsEditingTopic(false); };
  const handleEditTopicClick = (t) => { setInlineTopicName(t.name); setIsEditingTopic(true); setIsAddingTopic(false); setActiveTopicId(t.id); };
  const cancelInlineTopicAction = () => { setIsAddingTopic(false); setIsEditingTopic(false); setInlineTopicName(''); };

  const handleDeleteTopicClick = async (t) => {
    if (window.confirm(`Delete the topic "${t.name}"? This action cannot be undone.`)) {
      const { error } = await supabase.from('topics').delete().eq('id', t.id);
      if (!error) {
        if (activeTopicId === t.id) setActiveTopicId(null);
        await fetchTopics(activeSubjectId);
      } else alert("Failed to delete topic: " + error.message);
    }
  };

  const saveInlineTopic = async () => {
    const trimmed = inlineTopicName.trim();
    if (!trimmed) { cancelInlineTopicAction(); return; }

    if (isAddingTopic) {
      if (!activeSubjectId) return alert("Select a subject first.");
      const { data, error } = await supabase.from('topics').insert([{ name: trimmed, subject_id: activeSubjectId }]).select();
      if (!error && data && data[0]) {
        await fetchTopics(activeSubjectId);
        setActiveTopicId(data[0].id);
      } else alert("Failed to add topic: " + error?.message);
    } else if (isEditingTopic && activeTopicId) {
      const { error } = await supabase.from('topics').update({ name: trimmed }).eq('id', activeTopicId);
      if (!error) await fetchTopics(activeSubjectId);
      else alert("Failed to edit topic: " + error.message);
    }
    cancelInlineTopicAction();
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#171717] text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden relative font-sans w-full">
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* HEADER exactly like StudentApp */}
      <header className="bg-gradient-to-r from-[#045c66] via-[#077d8a] to-[#0996a6] text-white shadow-lg z-40 shrink-0 border-b border-[#045c66]/30">
        <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center justify-between shrink-0 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-2 drop-shadow-sm mr-2">
                 Admin
              </h1>
              
              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={topActionButtonClass}
              >
                {isDarkMode ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="4" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                  </svg>
                )}
              </button>

              <a
                href="/"
                className={topActionButtonClass + " hidden md:flex w-auto px-4 font-bold text-sm ml-2 bg-white/20"}
              >
                &larr; Exit Admin
              </a>
            </div>
            
            <button 
              className="md:hidden p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm ml-auto"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              </svg>
            </button>
          </div>
          
          <div className="overflow-x-auto py-2 px-1 snap-x w-full justify-end">
             <nav className="flex gap-3 min-w-max md:justify-end items-center">
              {availableTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    setActiveTopicId(topic.id);
                    setOpenQuestionIndex(null);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 whitespace-nowrap snap-start shrink-0 group ${
                    activeTopicId === topic.id 
                      ? 'bg-white text-[#077d8a] shadow-md scale-105 transform' 
                      : 'bg-[#045c66]/50 text-[#c7f0f4] hover:bg-[#045c66]/80 hover:text-white'
                  }`}
                >
                  {topic.name}
                  {activeTopicId === topic.id && (
                    <span className="flex items-center gap-1 ml-1 opacity-70 hover:opacity-100">
                      <svg onClick={(e) => { e.stopPropagation(); handleEditTopicClick(topic); }} className="w-3.5 h-3.5 hover:text-blue-500 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      <svg onClick={(e) => { e.stopPropagation(); handleDeleteTopicClick(topic); }} className="w-3.5 h-3.5 hover:text-rose-500 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </span>
                  )}
                </button>
              ))}
              
              {activeSubjectId && (
                isAddingTopic || isEditingTopic ? (
                   <div className="flex items-center gap-1 ml-2 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm shrink-0">
                      <input
                        type="text" autoFocus
                        className="px-2 py-1 rounded-md text-sm text-slate-800 focus:outline-none min-w-[120px] bg-white border border-transparent focus:border-white shadow-inner"
                        value={inlineTopicName} onChange={(e) => setInlineTopicName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveInlineTopic(); if (e.key === 'Escape') cancelInlineTopicAction(); }}
                        placeholder={isAddingTopic ? "New Topic" : "Edit Topic"}
                      />
                      <button onClick={saveInlineTopic} className="text-white hover:text-emerald-300 p-1 group"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></button>
                      <button onClick={cancelInlineTopicAction} className="text-white hover:text-rose-300 p-1 group"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                   </div>
                ) : (
                  <button
                    onClick={handleAddTopicClick}
                    className="px-4 py-2 ml-2 rounded-full font-bold text-sm border border-white/30 text-white hover:bg-white/10 transition-colors shrink-0"
                  >
                    + Add Topic
                  </button>
                )
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">

        <div className="hidden md:flex w-16 h-full shrink-0 border-r border-slate-200/60 dark:border-slate-700/70 bg-white/70 dark:bg-[#171717]/70 backdrop-blur-xl z-20">
          <div className="w-full flex flex-col items-center pt-4">
            <button
              className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-[#077d8a] border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition-all"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        
        {isSidebarOpen && (
          <div className="absolute inset-0 bg-[#171717]/40 z-20 md:hidden backdrop-blur-md transition-opacity" onClick={() => setIsSidebarOpen(false)} />
        )}

        <aside className={`absolute md:relative w-[85%] h-full bg-white/90 dark:bg-[#171717]/90 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-700/60 flex flex-col shadow-2xl md:shadow-none z-30 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0 ${
          isSidebarOpen ? 'translate-x-0 md:w-72 md:opacity-100' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:border-r-0 md:pointer-events-none'
        }`}>
          <div className="p-6 h-full flex flex-col overflow-y-auto hide-scroll">
            <div className="mb-6 flex justify-between items-center shrink-0">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#077d8a]/60">
                Subjects Library
              </h2>
            </div>
            
            <nav className="flex flex-col gap-2.5">
              {subjectsSorted.map((subject) => (
                <div key={subject.id} className="relative group flex flex-col">
                  <button
                    onClick={() => {
                      setActiveSubjectId(subject.id);
                      setOpenQuestionIndex(null);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={`text-left px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                      activeSubjectId === subject.id 
                        ? 'bg-[#077d8a]/10 text-[#077d8a] shadow-sm ring-1 ring-[#077d8a]/30 translate-x-1' 
                        : 'text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-100 hover:translate-x-1'
                    }`}
                  >
                    {subject.name}
                  </button>
                  {activeSubjectId === subject.id && (
                     <div className="flex gap-2 p-2 justify-end right-2 absolute right-0 top-2 opacity-50 hover:opacity-100">
                       <button onClick={(e) => { e.stopPropagation(); handleEditSubjectClick(subject); }}><svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDeleteSubjectClick(subject); }}><svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                     </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 shrink-0">
              {(isAddingSubject || isEditingSubject) ? (
                 <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                 <input
                   type="text" autoFocus
                   className="px-3 py-2 border border-[#077d8a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#077d8a]/30 w-full"
                   value={inlineSubjectName} onChange={(e) => setInlineSubjectName(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') saveInlineSubject(); if (e.key === 'Escape') cancelInlineAction(); }}
                   placeholder={isAddingSubject ? "New Subject" : "Edit Subject"}
                 />
                 <div className="flex justify-end gap-2">
                   <button onClick={cancelInlineAction} className="text-xs text-slate-500 font-bold">Cancel</button>
                   <button onClick={saveInlineSubject} className="text-xs bg-[#077d8a] text-white rounded-lg px-3 py-1 font-semibold">{isAddingSubject ? 'Save' : 'Update'}</button>
                 </div>
               </div>
              ) : (
                <button
                  onClick={handleAddSubjectClick}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-[#077d8a] hover:bg-[#077d8a]/5 text-sm font-semibold text-slate-500 hover:text-[#077d8a] transition-colors"
                >
                  + Add Subject
                </button>
              )}
            </div>

          </div>
        </aside>

        <main className="flex-1 overflow-y-auto w-full bg-slate-50/50 dark:bg-slate-950/60 relative hide-scroll">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#077d8a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className={`mx-auto p-4 md:p-10 lg:p-12 relative z-10 max-w-5xl`}>
            
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0 border-b border-slate-200/60 dark:border-slate-700/60 pb-8">
              <div className="flex-1">
                 <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                  {activeTopicName}
                </h2>
                <p className="text-slate-500 dark:text-slate-300 mt-3 text-base md:text-lg font-medium flex items-center flex-wrap gap-3">
                  <span className="bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-200 px-2.5 py-0.5 rounded-md text-sm font-bold shadow-sm">
                    {activeSubjectName}
                  </span> 
                  Admin specific question management
                </p>
              </div>

              {activeTopicId && (
                <button
                  onClick={openCreateModal}
                  className="px-8 py-4 bg-[#077d8a] text-white rounded-3xl font-black shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Add Question
                </button>
              )}
            </header>

            {!activeTopicId ? (
              <div className="text-center py-20 bg-white/50 dark:bg-[#171717]/50 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm">
                 <div className="text-5xl mb-4 opacity-50">📂</div>
                 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No active topic</h3>
                 <p className="text-slate-500 mt-2">Select or create a subject and topic to view or add questions.</p>
              </div>
            ) : loading && questions.length === 0 ? (
               <div className="flex justify-center p-12">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#077d8a]"></div>
               </div>
            ) : questions.length === 0 ? (
               <div className="text-center p-12 bg-white/80 dark:bg-[#171717]/80 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <div className="text-6xl mb-6 opacity-80">📝</div>
                 <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">No questions found</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-base">Create a new question in this topic.</p>
               </div>
            ) : (
               <div className="flex flex-col pt-2 pb-16 gap-4">
                 {questions.map((q, index) => {
                    let parsedAnswer = q.answer;
                    if ((q.type === 'comparison' || !q.answer) && q.answers && q.answers.length > 0) {
                      try { parsedAnswer = JSON.parse(q.answers[0].answer); } catch(e) {}
                    } else if (typeof q.answer === 'string') {
                       if (q.answer.includes('<') && q.answer.includes('>')) {
                           parsedAnswer = q.answer;
                       } else {
                           parsedAnswer = q.answer.split('\n').filter(l => l.trim() !== '');
                       }
                    }

                    let parsedImages = undefined;
                    if (q.images) parsedImages = q.images.split(',').map(s => s.trim()).filter(s => s !== '');

                    const adminActions = (
                      <>
                         <button 
                           onClick={() => openEditModal(q)}
                           className="p-1.5 md:p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-blue-500/30 font-semibold"
                           title="Edit"
                         >
                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                           </svg>
                         </button>
                         <button 
                           onClick={() => handleDelete(q.id)}
                           className="p-1.5 md:p-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-rose-500/30 font-semibold"
                           title="Delete"
                         >
                           <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                         </button>
                      </>
                    );

                    return (
                      <AccordionItem
                        key={q.id}
                        question={q.question}
                        answer={parsedAnswer}
                        type={q.type}
                        headers={q.headers}
                        images={parsedImages}
                        isOpen={openQuestionIndex === index}
                        onClick={() => handleToggleQuestion(index)}
                        adminActions={adminActions}
                      />
                    );
                 })}
               </div>
            )}
          </div>
        </main>
      </div>

      {isModalOpen && <QuestionFormModal questionData={editingQuestion} onClose={(wasSaved) => { setIsModalOpen(false); if (wasSaved) fetchQuestions(); }} />}
    </div>
  );
}
