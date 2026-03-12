import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function QuestionFormModal({ questionData, onClose }) {
  const isEditing = !!questionData;
  
  const resolveInitialAnswer = (qData) => {
    if (!qData) return '';
    
    // If it has table data from answers table
    if (!qData.answer && qData.answers && qData.answers.length > 0) {
      return qData.answers[0].answer;
    }
    
    return Array.isArray(qData.answer) ? qData.answer.join('\n') : (qData.answer || '');
  };

  const [formData, setFormData] = useState({
    subject_id: questionData?.subject_id || 1,
    topic_id: questionData?.topic_id || '',
    question: questionData?.question || '',
    answer: resolveInitialAnswer(questionData),
    images: questionData ? (Array.isArray(questionData.images) ? questionData.images.join(',') : (questionData.images || '')) : ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);

  // Fetch all subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('id, name').order('id');
      if (data) setAvailableSubjects(data);
    };
    fetchSubjects();
  }, []);

  // Fetch topics when subject changes
  useEffect(() => {
    let ignore = false;
    const fetchTopics = async () => {
      if (!formData.subject_id) return;
      const { data } = await supabase
        .from('topics')
        .select('id, name')
        .eq('subject_id', formData.subject_id)
        .order('id');

      if (!ignore && data) {
        setAvailableTopics(data);
        // Use an updater function to ensure we're checking against the most recent topic_id
        setFormData(prev => {
          if (!data.find(t => t.id == prev.topic_id)) {
            return { ...prev, topic_id: data[0]?.id || '' };
          }
          return prev;
        });
      }
    };
    fetchTopics();
    return () => { ignore = true; };
  }, [formData.subject_id]);

  useEffect(() => {
    if (questionData) {
      const imagesText = Array.isArray(questionData.images)
        ? questionData.images.join(',')
        : (questionData.images || '');

      setFormData({
        subject_id: questionData.subject_id || 1,
        topic_id: questionData.topic_id || '',
        question: questionData.question || '',
        answer: resolveInitialAnswer(questionData),
        images: imagesText
      });
    }
  }, [questionData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        subject_id: parseInt(formData.subject_id),
        topic_id: parseInt(formData.topic_id),
        question: formData.question,
        // Using original format or just a string if DB prefers text. DB schema for answer is 'text' or jsonb?
        // Wait, if it's text, array might be rejected or automatically mapped to JSON.
        // The error log earlier: "The DB 'answer' column is of type 'text'".
        // Then answerArray will fail? Let's just fix the field to what I had, or use formData.answer directly as string.
        answer: formData.answer,
      };

      if (isEditing) {
        const hasLinkedAnswer = questionData?.answers && questionData.answers.length > 0;

        if (hasLinkedAnswer) {
          // 1. Update the linked answers table
          const { error: ansError } = await supabase
            .from('answers')
            .update({ answer: formData.answer })
            .eq('id', questionData.answers[0].id);
            
          if (ansError) throw ansError;

          // 2. Update questions table without overwriting the null answer
          const { error: updateError } = await supabase
            .from('questions')
            .update({
              subject_id: parseInt(formData.subject_id),
              topic_id: parseInt(formData.topic_id),
              question: formData.question
            })
            .eq('id', questionData.id);
            
          if (updateError) throw updateError;
        } else {
          // Update questions table normally
          const { error: updateError } = await supabase
            .from('questions')
            .update(payload)
            .eq('id', questionData.id);

          if (updateError) throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('questions')
          .insert([payload]);
          
        if (insertError) throw insertError;
      }

      onClose(true); // Close and indicate a save occurred
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">
            {isEditing ? 'Edit Question' : 'Add New Question'}
          </h3>
          <button 
            onClick={() => onClose(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form id="question-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#077d8a]"
                  required
                >
                  {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Topic</label>
                <select
                  name="topic_id"
                  value={formData.topic_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#077d8a]"
                  required
                >
                  {availableTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Question</label>
              <textarea 
                name="question"
                value={formData.question}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#077d8a] resize-y"
                placeholder="Enter the question text..."
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-slate-700">Answer</label>
                <span className="text-xs text-slate-500">Each new line becomes a separate list item/bullet point.</span>
              </div>
              <textarea 
                name="answer"
                value={formData.answer}
                onChange={handleChange}
                rows={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#077d8a] resize-y font-mono text-sm"
                placeholder="Line 1: Main concept&#10;Line 2: Supporting detail&#10;Line 3: Example"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-slate-700">Images (Optional)</label>
                <span className="text-xs text-slate-500">Comma-separated paths (e.g. /img1.png, /img2.png)</span>
              </div>
              <input 
                type="text"
                name="images"
                value={formData.images}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#077d8a]"
                placeholder="/relationship.png, /marketplace.png"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 mt-auto">
          <button 
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="question-form"
            disabled={loading}
            className="px-6 py-2 bg-[#045c66] hover:bg-[#077d8a] text-white rounded-lg font-semibold transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isEditing ? 'Save Changes' : 'Create Question'}
          </button>
        </div>

      </div>
    </div>
  );
}
