import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import QuestionFormModal from './QuestionFormModal';

export default function QuestionsManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Filtering states
  const [filterSubjectId, setFilterSubjectId] = useState('All');
  const [filterTopicId, setFilterTopicId] = useState('All');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);

  // Inline Editing States for Subjects
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [inlineSubjectName, setInlineSubjectName] = useState('');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);    
  const subjectDropdownRef = useRef(null);

  // Inline Editing States for Topics
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [inlineTopicName, setInlineTopicName] = useState('');
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);    
  const topicDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target)) {
        setIsSubjectDropdownOpen(false);
      }
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(event.target)) {
        setIsTopicDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name').order('id');
    if (data) setAvailableSubjects(data);
  };

  // Fetch all subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubjectClick = () => {
    setInlineSubjectName('');
    setIsAddingSubject(true);
    setIsEditingSubject(false);
    setIsSubjectDropdownOpen(false);
  };

  const handleEditSubjectClick = (subjectId = filterSubjectId) => {
    if (subjectId === 'All') return;
    const currentSubject = availableSubjects.find(s => s.id == subjectId);
    if (currentSubject) {
      setFilterSubjectId(subjectId);
      setInlineSubjectName(currentSubject.name);
      setIsEditingSubject(true);
      setIsAddingSubject(false);
      setIsSubjectDropdownOpen(false);
    }
  };

  const cancelInlineAction = () => {
    setIsAddingSubject(false);
    setIsEditingSubject(false);
    setInlineSubjectName('');
  };

  const handleDeleteSubjectClick = async (subjectId = filterSubjectId) => {
    if (subjectId === 'All') return;
    const currentSubject = availableSubjects.find(s => s.id == subjectId);
    if (!currentSubject) return;

    if (window.confirm(`Are you sure you want to delete the subject "${currentSubject.name}"? This action cannot be undone.`)) {
      const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
      if (!error) {
        if (filterSubjectId === subjectId) {
          setFilterSubjectId('All');
        }
        await fetchSubjects();
      } else {
        alert("Failed to delete subject: " + error.message);
      }
    }
  };

  const saveInlineSubject = async () => {
    const trimmed = inlineSubjectName.trim();
    if (!trimmed) {
      cancelInlineAction();
      return;
    }

    if (isAddingSubject) {
      const exists = availableSubjects.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        alert("Subject already exists!");
        return;
      }
      const { data, error } = await supabase.from('subjects').insert([{ name: trimmed }]).select();
      if (!error && data && data[0]) {
        await fetchSubjects();
        setFilterSubjectId(data[0].id);
      } else if (error) {
        alert("Failed to add subject: " + error.message);
      }
    } else if (isEditingSubject) {
      if (filterSubjectId === 'All') return;
      const currentSubject = availableSubjects.find(s => s.id == filterSubjectId);
      if (currentSubject && currentSubject.name !== trimmed) {
        const { error } = await supabase.from('subjects').update({ name: trimmed }).eq('id', filterSubjectId);
        if (!error) {
          await fetchSubjects();
        } else {
          alert("Failed to edit subject: " + error.message);
        }
      }
    }

    cancelInlineAction();
  };

  const fetchTopics = async (subjectId = filterSubjectId) => {
    if (subjectId === 'All') {
      setAvailableTopics([]);
      return;
    }
    const { data } = await supabase
      .from('topics')
      .select('id, name')
      .eq('subject_id', subjectId)
      .order('id');
    if (data) setAvailableTopics(data);
  };

  // Fetch topics when subject selection changes
  useEffect(() => {
    fetchTopics(filterSubjectId);
    setFilterTopicId('All');
  }, [filterSubjectId]);

  // Topic Inline Handlers
  const handleAddTopicClick = () => {
    setInlineTopicName('');
    setIsAddingTopic(true);
    setIsEditingTopic(false);
    setIsTopicDropdownOpen(false);
  };

  const handleEditTopicClick = (topicId = filterTopicId) => {
    if (topicId === 'All') return;
    const currentTopic = availableTopics.find(t => t.id == topicId);
    if (currentTopic) {
      setFilterTopicId(topicId);
      setInlineTopicName(currentTopic.name);
      setIsEditingTopic(true);
      setIsAddingTopic(false);
      setIsTopicDropdownOpen(false);
    }
  };

  const cancelInlineTopicAction = () => {
    setIsAddingTopic(false);
    setIsEditingTopic(false);
    setInlineTopicName('');
  };

  const handleDeleteTopicClick = async (topicId) => {
    if (topicId === 'All') return;
    const currentTopic = availableTopics.find(t => t.id == topicId);
    if (!currentTopic) return;

    if (window.confirm(`Are you sure you want to delete the topic "${currentTopic.name}"? This action cannot be undone.`)) {
      const { error } = await supabase.from('topics').delete().eq('id', topicId);
      if (!error) {
        if (filterTopicId === topicId) {
          setFilterTopicId('All');
        }
        await fetchTopics();
      } else {
        alert("Failed to delete topic: " + error.message);
      }
    }
  };

  const saveInlineTopic = async () => {
    const trimmed = inlineTopicName.trim();
    if (!trimmed) {
      cancelInlineTopicAction();
      return;
    }

    if (isAddingTopic) {
      if (filterSubjectId === 'All') {
        alert("Please select a subject first before adding a topic.");
        return;
      }
      const exists = availableTopics.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        alert("Topic already exists in this subject!");
        return;
      }
      const { data, error } = await supabase.from('topics').insert([{ name: trimmed, subject_id: filterSubjectId }]).select();
      if (!error && data && data[0]) {
        await fetchTopics();
        setFilterTopicId(data[0].id);
      } else if (error) {
        alert("Failed to add topic: " + error.message);
      }
    } else if (isEditingTopic) {
      if (filterTopicId === 'All') return;
      const currentTopic = availableTopics.find(t => t.id == filterTopicId);
      if (currentTopic && currentTopic.name !== trimmed) {
        const { error } = await supabase.from('topics').update({ name: trimmed }).eq('id', filterTopicId);
        if (!error) {
          await fetchTopics();
        } else {
          alert("Failed to edit topic: " + error.message);
        }
      }
    }
    cancelInlineTopicAction();
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Perform a join implicitly using Supabase's foreign key relation parsing
      let query = supabase
        .from('questions')
        .select('*, subjects!inner(name), topics!inner(name), answers(*)')
        .order('id', { ascending: true });

      if (filterSubjectId !== 'All') {
        query = query.eq('subject_id', filterSubjectId);
      }
      if (filterTopicId !== 'All') {
        query = query.eq('topic_id', filterTopicId);
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
  }, [filterSubjectId, filterTopicId]);
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      
      // Update local state
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err) {
      console.error("Error deleting question:", err);
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

  const handleModalClose = (wasSaved) => {
    setIsModalOpen(false);
    setEditingQuestion(null);
    if (wasSaved) {
      fetchQuestions(); // Refresh list if a question was saved
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manage Questions</h2>
          <p className="text-sm text-slate-500">Create, edit, or remove study questions.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          <div className="flex items-center gap-1 group">
            {(isEditingSubject || isAddingSubject) ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  className="px-3 py-2 border border-[#077d8a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#077d8a] min-w-[160px]"
                  value={inlineSubjectName}
                  onChange={(e) => setInlineSubjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveInlineSubject();
                    if (e.key === 'Escape') cancelInlineAction();
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder={isAddingSubject ? "New Subject Name" : "Edit Name"}
                />
                <button
                  onClick={saveInlineSubject}
                  title="Save"
                  className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={cancelInlineAction}
                  title="Cancel"
                  className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
                <div className="relative" ref={subjectDropdownRef}>
                  <button
                    onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                    className="flex justify-between items-center px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-50 min-w-[200px]"
                  >
                    <span className="truncate">
                      {filterSubjectId === 'All' ? 'All Subjects' : availableSubjects.find(s => s.id == filterSubjectId)?.name || 'Select Subject'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isSubjectDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-slate-200 py-1" style={{ minWidth: 'max-content' }}>
                      <div 
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                        onClick={() => { setFilterSubjectId('All'); setIsSubjectDropdownOpen(false); }}
                      >
                        All Subjects
                      </div>
                      {availableSubjects.map(sub => (
                        <div 
                          key={sub.id} 
                          className="flex justify-between items-center px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm group"
                          onClick={() => { setFilterSubjectId(sub.id); setIsSubjectDropdownOpen(false); }}
                        >
                          <span className={filterSubjectId == sub.id ? "font-semibold text-[#077d8a]" : ""}>{sub.name}</span>
                          <div className="hidden group-hover:flex items-center gap-1.5 ml-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditSubjectClick(sub.id); }}
                              title="Edit Subject"
                              className="text-slate-400 hover:text-[#077d8a] transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteSubjectClick(sub.id); }}
                              title="Delete Subject"
                              className="text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 my-1"></div>
                      <div 
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-[#077d8a] font-medium flex items-center gap-2"
                        onClick={() => { handleAddSubjectClick(); }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Subject
                      </div>
                    </div>
                  )}
                </div>)}
          </div>

          {filterSubjectId !== 'All' && (
            <div className="relative" ref={topicDropdownRef}>
              {(isEditingTopic || isAddingTopic) ? (
                <div className="flex items-center gap-1 group">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      className="px-3 py-2 border border-[#077d8a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#077d8a] min-w-[160px]"
                      value={inlineTopicName}
                      onChange={(e) => setInlineTopicName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveInlineTopic();
                        if (e.key === 'Escape') cancelInlineTopicAction();
                      }}
                      onFocus={(e) => e.target.select()}
                      placeholder={isAddingTopic ? "New Topic Name" : "Edit Name"}
                    />
                    <button
                      onClick={saveInlineTopic}
                      title="Save"
                      className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={cancelInlineTopicAction}
                      title="Cancel"
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                    className="flex justify-between items-center px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-50 min-w-[200px]"
                  >
                    <span className="truncate">
                      {filterTopicId === 'All' ? 'All Topics' : availableTopics.find(t => t.id == filterTopicId)?.name || 'Select Topic'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isTopicDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-slate-200 py-1" style={{ minWidth: 'max-content' }}>
                      <div
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                        onClick={() => { setFilterTopicId('All'); setIsTopicDropdownOpen(false); }}
                      >
                        All Topics
                      </div>
                      {availableTopics.map(topic => (
                        <div
                          key={topic.id}
                          className="flex justify-between items-center px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm group"
                          onClick={() => { setFilterTopicId(topic.id); setIsTopicDropdownOpen(false); }}
                        >
                          <span className={filterTopicId == topic.id ? "font-semibold text-[#077d8a]" : ""}>{topic.name}</span>
                          <div className="hidden group-hover:flex items-center gap-1.5 ml-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditTopicClick(topic.id); }}
                              title="Edit Topic"
                              className="text-slate-400 hover:text-[#077d8a] transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteTopicClick(topic.id); }}
                              title="Delete Topic"
                              className="text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 my-1"></div>
                      <div
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-[#077d8a] font-medium flex items-center gap-2"
                        onClick={() => { handleAddTopicClick(); }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Topic
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#045c66] hover:bg-[#077d8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          Failed to load questions: {error}
        </div>
      )}

      {loading && questions.length === 0 ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#077d8a]"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600 text-sm w-12 text-center">No.</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Subject</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Topic</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Question</th>
                    <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                      No questions found. Click "Add Question" to create one.
                    </td>
                  </tr>
                ) : (
                  questions.map((q, index) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 align-top text-center text-slate-500 font-medium text-sm">
                        {index + 1}
                      </td>
                      <td className="p-4 align-top">
                        <div className="font-medium text-slate-800 text-sm">{q.subjects?.name || 'Unknown'}</div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="text-xs text-slate-600 bg-slate-100 inline-block px-2 py-1 rounded-md border border-slate-200">{q.topics?.name || 'Unknown'}</div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="text-sm text-slate-700 font-medium line-clamp-2">{q.question}</div>
                        </td>
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(q)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(q.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <QuestionFormModal 
          questionData={editingQuestion} 
          onClose={handleModalClose} 
        />
      )}
    </div>
  );
}
