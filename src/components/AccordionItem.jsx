import React from 'react';

export default function AccordionItem({
  question,
  answer,
  type,
  headers,
  images,
  pdfLink,
  isOpen,
  onClick,
  isMemorized,
  onToggleMemorized,
  onSendToAi,
  isAiSelected,
  isSendingToAi,
  adminActions
}) {
  return (
    <div className="font-sans flex gap-3 md:gap-4 items-start w-full mb-4">
      {onToggleMemorized !== undefined && (
        <div
          onClick={onToggleMemorized}
          className={`mt-5 md:mt-6 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95 ${isMemorized
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'bg-white dark:bg-[#171717] border-slate-300 dark:border-slate-600 hover:border-[#077d8a]'
            }`}
          title={isMemorized ? 'Mark as unmemorized' : 'Mark as memorized'}
        >
          {isMemorized && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      <div
        className={`flex-1 transition-all duration-300 ease-out rounded-2xl bg-white dark:bg-[#171717] overflow-hidden ${isOpen
          ? 'shadow-md ring-4 ring-[#077d8a]/10'
          : 'shadow-sm hover:shadow-md'
          } ${isMemorized && !isOpen ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/40' : ''}`}
      >
        <div
          className={`w-full text-justify p-4 md:px-6 flex flex-col gap-3 md:flex-row md:justify-between md:items-center bg-transparent cursor-pointer select-none group transition-all duration-300 ${
            isOpen ? 'md:pt-5 md:pb-2' : 'md:py-5'
          }`}
          onClick={onClick}
        >
          <div className="flex items-start md:items-center md:pr-4 min-w-0">
            <span
              className={`font-medium text-slate-900 dark:text-slate-100 md:text-lg leading-snug transition-colors duration-200 ${isOpen
                ? 'text-[#077d8a]'
                : isMemorized
                  ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600'
                  : 'text-slate-900 dark:text-slate-100 group-hover:text-[#077d8a]/80'
                }`}
            >
              {question}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {isAiSelected && !isSendingToAi && (
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#077d8a]/10 text-[#077d8a] border border-[#077d8a]/20 shadow-sm"
                title="Selected for AI"
              >
                AI
              </span>
            )}

            {onSendToAi && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSendToAi();
                }}
                disabled={isSendingToAi}
                className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all shadow-sm ${isSendingToAi
                  ? 'bg-[#077d8a]/10 text-[#077d8a] border-[#077d8a]/30 cursor-wait'
                  : isAiSelected
                    ? 'bg-[#077d8a]/10 text-[#077d8a] border-[#077d8a]/30 hover:bg-[#077d8a]/20'
                    : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-300 border-rose-200 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-200'
                  }`}
              >
                {isSendingToAi ? 'Sending...' : 'Send to AI'}
              </button>
            )}

            {adminActions && (
              <div className="flex items-center gap-1.5 md:gap-2 mr-1">
                {adminActions}
              </div>
            )}

            <span
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isOpen
                ? 'bg-[#077d8a]/10 text-[#077d8a] rotate-180'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300 group-hover:bg-[#077d8a]/10 group-hover:text-[#077d8a]'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
        >
          <div className="overflow-hidden">
            <div className="p-6 md:px-12 md:pb-8 pt-0 bg-white dark:bg-[#171717] overflow-x-auto">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mb-3"></div>

              {images && images.length > 0 && (
                <div className="flex flex-col gap-4 mb-4">
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${question} diagram ${idx + 1}`}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                  ))}
                </div>
              )}

              {pdfLink && (
                <div className="mb-6 flex justify-start">
                  <a
                    href={pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#077d8a]/10 text-[#077d8a] font-bold text-sm rounded-xl hover:bg-[#077d8a]/20 transition-colors border border-[#077d8a]/20 shadow-sm"
                  >
                    Open Source PDF
                  </a>
                </div>
              )}

              {type === 'comparison' ? (
                <div className="min-w-max md:min-w-0 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#077d8a]/10">
                        {headers.map((head, idx) => (
                          <th
                            key={idx}
                            className={`p-4 font-bold text-[#077d8a] border-b border-[#077d8a]/20 ${idx < headers.length - 1 ? 'border-r border-[#077d8a]/10' : ''}`}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {answer.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className={`p-4 text-slate-700 dark:text-slate-200 text-[15px] md:text-base font-semibold leading-relaxed align-top whitespace-pre-line text-justify ${cellIdx < row.length - 1 ? 'border-r border-slate-100 dark:border-slate-700' : ''}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : typeof answer === 'string' ? (
                <div
                  className="max-w-none text-slate-700 dark:text-slate-200 text-[15px] md:text-base font-medium leading-relaxed prose prose-slate dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 text-justify prose-p:text-justify prose-li:text-justify"
                  dangerouslySetInnerHTML={{ 
                    __html: answer.replace(/\sstyle="[^"]*"/gi, '') 
                  }}
                />
              ) : (
                <div className="max-w-none">
                  {answer.map((paragraph, index) => (
                    <p
                      key={index}
                      className="mb-3 text-slate-700 dark:text-slate-200 text-base md:text-[17px] font-medium leading-6 text-justify last:mb-0"
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
