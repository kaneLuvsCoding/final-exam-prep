import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function QuestionFormModal({ questionData, onClose }) {
  const isEditing = !!questionData;
  
  const [formData, setFormData] = useState({
    subject: 'Technical Writing',
    category: 'Short Questions',
    question: '',
    answer: '',
    images: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subjects = ['Technical Writing', 'Analysis of Algorithm', 'BMIS', 'ERP', 'Advanced DBMS', 'SQM'];
  const categories = ['Short Questions', 'Long Questions'];

  useEffect(() => {
    if (questionData) {
      // Parse array answers back into newline-separated string for editing
      const answerText = Array.isArray(questionData.answer) 
        ? questionData.answer.join('\n') 
        : (questionData.answer || '');
        
      const imagesText = Array.isArray(questionData.images)
        ? questionData.images.join(',')
        : (questionData.images || '');

      setFormData({
        subject: questionData.subject || subjects[0],
        category: questionData.category || categories[0],
        question: questionData.question || '',
        answer: answerText,
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
      // Convert answer text block into JSON array of strings
      const answerArray = formData.answer
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
        
      // Convert images CSV into array
      const imagesArray = formData.images
        .split(',')
        .map(img => img.trim())
        .filter(img => img.length > 0);

      const payload = {
        subject: formData.subject,
        category: formData.category,
        question: formData.question,
        answer: answerArray,
        images: imagesArray.length > 0 ? imagesArray : null
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('questions')
          .update(payload)
          .eq('id', questionData.id);
          
        if (updateError) throw updateError;
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
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#077d8a]"
                  required
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#077d8a]"
                  required
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
