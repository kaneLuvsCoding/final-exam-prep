import React, { useState } from 'react';
import practiceData from '../data/bmis_qa.json';

export default function BMISPractice({ onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const playSound = (src) => {
    if (isMuted) return;
    new Audio(src).play().catch(() => { });
  };

  const currentQ = practiceData[currentIndex];
  const totalQ = practiceData.length;

  const handleSelectOption = (opt) => {
    if (showAnswer) return;
    setSelectedOption(opt);
  };

  const handleReveal = () => {
    if (!selectedOption) return;

    // Sometimes the option in JSON is "A. Option Text", so we remove the letter prefix for comparison
    const cleanOpt = selectedOption.replace(/^[A-Da-d]\.\s*/, '').trim();
    // Answer format is usually "B. Option Text". We can check against the whole string or just the text
    const cleanAnswerText = currentQ.answer.replace(/^[A-Da-d]\.\s*/, '').trim();
    const correct = cleanOpt === cleanAnswerText || selectedOption.trim() === currentQ.answer.trim();

    setIsCorrect(correct);
    setShowAnswer(true);
    if (correct) {
      setScore(prev => prev + 1);
      const newCombo = comboCount + 1;
      setComboCount(newCombo);
      playSound(`/${Math.min(newCombo, 8)}.mp3`);
    } else {
      setComboCount(0);
      playSound('/vine-boom.mp3');
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQ) {
      setCompleted(true);
      if (score >= totalQ * 0.5) {
        playSound('/anime-wow-sound-effect.mp3');
      } else {
        playSound('/cat-laugh-meme-1.mp3');
      }
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowAnswer(false);
      setIsCorrect(false);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setIsCorrect(false);
    setScore(0);
    setCompleted(false);
    setComboCount(0);
  };

  // Keyboard support
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (!showAnswer) {
          if (selectedOption) handleReveal();
        } else {
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, selectedOption, currentIndex]);

  if (completed) {
    const isFail = score < totalQ * 0.5;
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in fade-in zoom-in duration-500">
        {isFail ? (
          <img src="/cat-meme-laughing-gif.gif" alt="Fail Cat Meme" className="h-48 md:h-64 object-contain rounded-2xl shadow-xl mb-6 mx-auto" />
        ) : (
          <div className="text-7xl mb-4 drop-shadow-xl">🏆</div>
        )}
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
          {isFail ? "You Failed!" : "Congratulations!"}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">
          Final Score: <span className={`font-black ${isFail ? 'text-rose-500' : 'text-[#6366f1]'}`}>{score}</span> / {totalQ}
        </p>
        <div className="flex gap-4 w-full max-w-xs mx-auto">
          <button onClick={restart} className="flex-1 py-3.5 bg-[#6366f1] text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all">Restart</button>
          {onBack && <button onClick={onBack} className="flex-1 py-3.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all">Exit</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 h-[calc(100vh-120px)] flex flex-col justify-center animate-in fade-in duration-500">

      {/* Compact Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1] text-white flex items-center justify-center font-bold shadow-md">B</div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">BMIS Practice</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-wider text-slate-400">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`hover:text-[#6366f1] transition-colors flex items-center gap-1.5 ${isMuted ? 'text-rose-400 opacity-80' : ''}`}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5L6 9H3v6h3l5 4V5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
                <span>Muted</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5L6 9H3v6h3l5 4V5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.5 8.5a5 5 0 010 7" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 6a9 9 0 010 12" />
                </svg>
                <span>Sound On</span>
              </>
            )}
          </button>
          <span>Score: <span className="text-[#6366f1]">{score}</span></span>
          {onBack && <button onClick={onBack} className="hover:text-[#6366f1] transition-colors">&larr; Back</button>}
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mb-6 relative overflow-hidden">
        <div
          className="bg-[#6366f1] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
          style={{ width: `${(currentIndex / totalQ) * 100}%` }}
        ></div>
      </div>

      {/* Question Card - Extremely Optimized for Space */}
      <div className="bg-white dark:bg-[#171717] rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-full">

        {/* Question Area */}
        <div className="p-5 md:p-7 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-[#6366f1]/10 text-[#6366f1] rounded text-[10px] font-black uppercase tracking-widest">Q{currentIndex + 1}</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {currentQ.question}
          </h3>
        </div>

        {/* Options - Compact Grid */}
        <div className="p-4 md:p-6 bg-slate-50/30 dark:bg-black/10 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQ.options.map((opt, i) => {
              const letterMatch = opt.match(/^[A-Da-d]/);
              const letter = letterMatch ? letterMatch[0] : String.fromCharCode(65 + i);
              const content = opt.replace(/^[A-Da-d]\.\s*/, '').trim();
              const isSelected = selectedOption === opt;

              let styles = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-[#6366f1]/50 hover:bg-white dark:hover:bg-slate-800 cursor-pointer";
              let dot = "bg-slate-200 dark:bg-slate-700 text-slate-500";

              if (showAnswer) {
                const cleanOptContent = content;
                const cleanAnswerContent = currentQ.answer.replace(/^[A-Da-d]\.\s*/, '').trim();
                const isCorrectOpt = cleanOptContent === cleanAnswerContent || opt.trim() === currentQ.answer.trim();
                if (isCorrectOpt) {
                  styles = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500";
                  dot = "bg-emerald-500 text-white";
                } else if (isSelected) {
                  styles = "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500";
                  dot = "bg-rose-500 text-white";
                } else {
                  styles = "border-slate-100 dark:border-slate-800 opacity-40 pointer-events-none";
                }
              } else if (isSelected) {
                styles = "border-[#6366f1] bg-[#6366f1]/5 text-[#6366f1] ring-1 ring-[#6366f1]";
                dot = "bg-[#6366f1] text-white";
              }

              return (
                <div
                  key={i}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-3 group ${styles}`}
                >
                  <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-black text-xs transition-colors ${dot}`}>
                    {letter.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold leading-tight">{content}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Area - Integrated and Slim */}
        <div className="px-6 py-4 bg-white dark:bg-[#171717] border-t border-slate-100 dark:border-slate-800">
          {!showAnswer ? (
            <button
              onClick={handleReveal}
              disabled={!selectedOption}
              className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 ${selectedOption
                  ? 'bg-[#6366f1] text-white shadow-[#6366f1]/20 hover:bg-[#4f46e5]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
            >
              Submit Answer
            </button>
          ) : (
            <div className="flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300 font-bold">
              <div className={`flex-1 p-3 rounded-xl flex items-center gap-3 border ${isCorrect ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:text-emerald-400' : 'bg-rose-50/50 border-rose-200 text-rose-800 dark:text-rose-400'}`}>
                <span className="text-xl">{isCorrect ? '✨' : '❌'}</span>
                <div className="text-xs">
                  <p className="uppercase tracking-tighter opacity-60">{isCorrect ? 'Correct' : 'Incorrect'}</p>
                  {!isCorrect && <p className="truncate max-w-[150px] md:max-w-none">Ans: {currentQ.answer}</p>}
                </div>
              </div>
              <button
                onClick={handleNext}
                className="px-8 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
