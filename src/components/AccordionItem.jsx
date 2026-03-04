// src/components/AccordionItem.jsx
import React from 'react';

export default function AccordionItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border border-slate-200 rounded-lg mb-4 bg-white shadow-sm overflow-hidden transition-all duration-200">
      <button
        className="w-full text-left p-5 flex justify-between items-center bg-white hover:bg-slate-50 focus:outline-none"
        onClick={onClick}
      >
        <span className="font-semibold text-slate-800 pr-6 leading-relaxed">{question}</span>
        <span className={`text-indigo-500 font-bold text-xl transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="p-5 bg-slate-50 border-t border-slate-200">
          <div className="prose prose-slate max-w-none">
            {answer.map((paragraph, index) => (
              <p key={index} className="mb-3 text-slate-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}