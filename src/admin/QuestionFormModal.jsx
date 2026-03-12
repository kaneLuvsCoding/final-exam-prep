import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default function QuestionFormModal({ questionData, onClose }) {
  const isEditing = !!questionData;
  
  const resolveInitialAnswer = (qData) => {
    if (!qData) return '';
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
    images: questionData ? (Array.isArray(questionData.images) ? questionData.images.join(',') : (questionData.images || '')) : '',
    pdfLink: questionData?.pdfLink || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // File Upload states
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('id, name').order('id');
      if (data) setAvailableSubjects(data);
    };
    fetchSubjects();
  }, []);

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
        images: imagesText,
        pdfLink: questionData.pdfLink || ''
      });
    }
  }, [questionData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuillChange = (content) => {
    setFormData(prev => ({ ...prev, answer: content }));
  };

  // Upload Handler
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    try {
      let newImages = [];
      let newPdf = formData.pdfLink;

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        // Upload to bucket 'study-materials'
        const { error: uploadError } = await supabase.storage
          .from('study-materials')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}. Make sure a public bucket named "study-materials" exists.`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('study-materials')
          .getPublicUrl(filePath);

        if (file.type.startsWith('image/')) {
          newImages.push(publicUrl);
        } else if (file.type === 'application/pdf') {
          newPdf = publicUrl; // usually just 1 PDF
        }
      }

      setFormData(prev => {
        const existingImages = prev.images ? prev.images.split(',').map(s => s.trim()).filter(Boolean) : [];
        const combinedImages = [...existingImages, ...newImages].join(', ');
        return {
          ...prev,
          images: combinedImages,
          pdfLink: newPdf || prev.pdfLink
        };
      });
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // reset input
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) return;
    setLoading(true);
    setError(null);

    try {
      const payload = {
        subject_id: parseInt(formData.subject_id),
        topic_id: parseInt(formData.topic_id),
        question: formData.question,
        answer: formData.answer,
        images: formData.images,
        pdfLink: formData.pdfLink
      };

      if (isEditing) {
        const hasLinkedAnswer = questionData?.answers && questionData.answers.length > 0;

        if (hasLinkedAnswer) {
           const { error: ansError } = await supabase
            .from('answers')
            .update({ answer: formData.answer })
            .eq('id', questionData.answers[0].id);
            
          if (ansError) throw ansError;

           const { error: updateError } = await supabase
            .from('questions')
            .update({
              subject_id: parseInt(formData.subject_id),
              topic_id: parseInt(formData.topic_id),
              question: formData.question,
              images: formData.images,
              pdfLink: formData.pdfLink
            })
            .eq('id', questionData.id);
            
          if (updateError) throw updateError;
        } else {
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

      onClose(true); 
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quill modules
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
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
        <div className="p-6 overflow-y-auto flex-1 hide-scroll">
          {error && (
             <div className="mb-4 bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
               <span className="text-lg leading-none mt-0.5">⚠️</span>
               <div>{error}</div>
             </div>
          )}

          <form id="question-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#077d8a]/50 bg-slate-50 font-medium"
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
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#077d8a]/50 bg-slate-50 font-medium"
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
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#077d8a]/50 resize-y text-lg font-bold"
                placeholder="Enter the question text..."
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-slate-700">Answer Explanation (Rich Text)</label>
              </div>
              <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#077d8a]/50 bg-white">
                <ReactQuill 
                  theme="snow" 
                  value={formData.answer} 
                  onChange={handleQuillChange}
                  modules={modules}
                  className="bg-white min-h-[200px]"
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
               <div>
                 <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Upload Media & Files</h4>
                 <p className="text-xs text-slate-500 font-medium mb-3">Upload Images or PDFs to attach to this question. They will be uploaded directly to Supabase.</p>
                 
                 <div className="flex items-center gap-4">
                   <button
                     type="button"
                     onClick={() => fileInputRef.current?.click()}
                     className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2 text-sm"
                     disabled={isUploading}
                   >
                     {isUploading ? 'Uploading...' : 'Choose Files...'}
                   </button>
                   <input
                     ref={fileInputRef}
                     type="file"
                     multiple
                     accept="image/*,application/pdf"
                     onChange={handleFileUpload}
                     className="hidden"
                   />
                   {isUploading && <span className="text-sm font-bold text-[#077d8a] animate-pulse">Processing files...</span>}
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                 <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1">Image URLs (Comma-separated)</label>
                   <input 
                     type="text"
                     name="images"
                     value={formData.images}
                     onChange={handleChange}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#077d8a]/50 text-sm font-mono text-slate-600 bg-white"
                     placeholder="e.g. /img1.png"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-700 mb-1">PDF Link</label>
                   <input 
                     type="text"
                     name="pdfLink"
                     value={formData.pdfLink}
                     onChange={handleChange}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#077d8a]/50 text-sm font-mono text-slate-600 bg-white"
                     placeholder="e.g. /notes.pdf"
                   />
                 </div>
               </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 mt-auto shrink-0">
           <button 
            type="button"
            onClick={() => onClose(false)}
            className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm"
            disabled={loading || isUploading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="question-form"
            disabled={loading || isUploading}
            className="px-8 py-2.5 bg-[#077d8a] hover:bg-[#066d79] text-white rounded-xl font-bold transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isEditing ? 'Save Changes' : 'Create Question'}
          </button>
        </div>

      </div>
      
      {/* Quill Custom Styles Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        .ql-container {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          font-family: inherit;
          font-size: 1rem;
        }
        .ql-toolbar {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          background: #f8fafc;
          border-color: #cbd5e1 !important;
        }
        .ql-container.ql-snow {
          border-color: #cbd5e1 !important;
        }
      `}} />
    </div>
  );
}
