import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import QuestionFormModal from './QuestionFormModal';

export default function QuestionsManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Filtering states
  const [filterSubject, setFilterSubject] = useState('All');
  
  const subjects = ['All', 'Technical Writing', 'Analysis of Algorithm', 'BMIS', 'ERP', 'Advanced DBMS', 'SQM'];

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from('questions').select('*').order('created_at', { ascending: false });
      
      if (filterSubject !== 'All') {
        query = query.eq('subject', filterSubject);
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
  }, [filterSubject]);

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
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#077d8a]"
          >
            {subjects.map(sub => (
              <option key={sub} value={sub}>{sub === 'All' ? 'All Subjects' : sub}</option>
            ))}
          </select>
          
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
                  <th className="p-4 font-semibold text-slate-600 text-sm">Subject / Category</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Question</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-slate-500">
                      No questions found. Click "Add Question" to create one.
                    </td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="font-medium text-slate-800 text-sm">{q.subject}</div>
                        <div className="text-xs text-slate-500 mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded-full">{q.category}</div>
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
