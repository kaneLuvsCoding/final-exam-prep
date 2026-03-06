import React from 'react';

export default function AccordionItem({ question, answer, type, headers, images, pdfLink, isOpen, onClick, isMemorized, onToggleMemorized }) {
  return (
    // NEW: Outer Flex Container that puts the checkbox and the card side-by-side
    <div className="flex gap-3 md:gap-4 items-start w-full mb-4">
      
      {/* Checkbox - Now sitting completely outside the accordion box */}
      <div 
        onClick={onToggleMemorized}
        className={`mt-5 md:mt-6 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95 ${
          isMemorized 
            ? 'bg-emerald-500 border-emerald-500 text-white' 
            : 'bg-white border-slate-300 hover:border-[#077d8a]'
        }`}
        title={isMemorized ? "Mark as unmemorized" : "Mark as memorized"}
      >
        {isMemorized && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Accordion Box */}
      <div 
        className={`flex-1 border transition-all duration-300 ease-out rounded-2xl bg-white overflow-hidden ${
          isOpen 
            ? 'border-[#077d8a]/40 shadow-md ring-4 ring-[#077d8a]/10' 
            : 'border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#077d8a]/30'
        } ${isMemorized && !isOpen ? 'opacity-60 bg-slate-50/50' : ''}`}
      >
        {/* Header Container */}
        <div
          className="w-full text-left p-5 md:p-6 flex justify-between items-start md:items-center bg-transparent cursor-pointer select-none group"
          onClick={onClick}
        >
          <div className="flex items-start md:items-center pr-4">
            {/* Question Text */}
            <span className={`font-bold text-base md:text-lg leading-snug transition-colors duration-200 ${
              isOpen 
                ? 'text-[#077d8a]' 
                : (isMemorized ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800 group-hover:text-[#077d8a]/80')
            }`}>
              {question}
            </span>
          </div>

          {/* Dropdown Caret */}
          <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 mt-0.5 md:mt-0 ${
            isOpen ? 'bg-[#077d8a]/10 text-[#077d8a] rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-[#077d8a]/10 group-hover:text-[#077d8a]'
          }`}>
            ▼
          </span>
        </div>
        
        {/* Animated Body */}
        <div 
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="p-5 md:p-6 pt-0 bg-white overflow-x-auto">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-5"></div>
              
              {/* Render Images */}
              {images && images.length > 0 && (
                <div className="flex flex-col gap-4 mb-4">
                  {images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`${question} diagram ${idx + 1}`} 
                      className="w-full rounded-xl border border-slate-200 shadow-sm"
                    />
                  ))}
                </div>
              )}

              {/* Render PDF Link */}
              {pdfLink && (
                <div className="mb-6 flex justify-start">
                  <a 
                    href={pdfLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#077d8a]/10 text-[#077d8a] font-bold text-sm rounded-xl hover:bg-[#077d8a]/20 transition-colors border border-[#077d8a]/20 shadow-sm"
                  >
                    📄 Open Source PDF
                  </a>
                </div>
              )}

              {/* Render Table or Text */}
              {type === "comparison" ? (
                <div className="min-w-max md:min-w-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#077d8a]/10">
                        {headers.map((head, idx) => (
                          <th key={idx} className={`p-4 font-bold text-[#077d8a] border-b border-[#077d8a]/20 ${idx < headers.length - 1 ? 'border-r border-[#077d8a]/10' : ''}`}>
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {answer.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className={`p-4 text-slate-600 text-[14px] md:text-[15px] align-top whitespace-pre-line ${cellIdx < row.length - 1 ? 'border-r border-slate-100' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  {answer.map((paragraph, index) => (
                    <p 
                      key={index} 
                      className="mb-4 text-slate-600 text-[15px] md:text-base leading-relaxed text-justify hyphens-auto last:mb-0"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}