import React, { useState } from 'react';

// Extracted and de-duplicated directly from Technical Writing.pdf
const practiceData = [
  { original: "May we borrow your ladder for half an hour?", keyword: "mind", answer: "Would you mind our borrowing/if we borrow/lending us your ladder for half an hour?" },
  { original: "\"I'm not frightened,\" he said; in fact, he was terrified.", keyword: "be", answer: "He pretended not to be frightened." },
  { original: "The Majestic is better than this hotel.", keyword: "Good", answer: "This hotel is not as/so good as the Majestic." },
  { original: "To enjoy travel, you must go on your own.", keyword: "only", answer: "You will/can only enjoy travelling if you go on your own." },
  { original: "You were very generous, giving us all that money.", keyword: "of", answer: "It was very generous of you to lend/give us all that money." },
  { original: "He was sorry he had asked the bank to lend him the money.", keyword: "wished", answer: "He wished he had not asked the bank to lend him the money." },
  { original: "I haven't owned a car for five years now.", keyword: "since", answer: "It is five years since I owned a car." },
  { original: "Why didn't you warn me it was going to rain?", keyword: "have", answer: "You should have warned me it was going to rain." },
  { original: "Heavy smokers are more likely to suffer serious illness than non-smokers.", keyword: "Runs", answer: "A heavy smoker runs more/a greater risk of serious illness than a non-smoker." },
  { original: "Even though she knew she had to get up early, Mary still went to the disco.", keyword: "despite", answer: "Mary still went to the disco despite knowing/the fact that she had to get up early." },
  { original: "Ken does not work half as much as he used to.", keyword: "Hard", answer: "Ken used to work twice as hard as he does now." },
  { original: "The experts thought that the cost of petrol would rise next year.", keyword: "expected", answer: "The cost of petrol is expected to rise next year." },
  { original: "Some people who start smoking find it difficult to stop.", keyword: "always", answer: "It is not always easy to stop smoking once you have started." },
  { original: "If he isn't careful, he is bound to end up in hospital.", keyword: "him", answer: "His carelessness is bound to put him in hospital." },
  { original: "Because of his illness he could not work effectively.", keyword: "impossible", answer: "His illness made it impossible for him to work effectively." },
  { original: "Scotsmen will never give anything to waiters.", keyword: "tip", answer: "No Scotsman will (ever) tip a waiter." },
  { original: "Mary said, I do not want to get married yet.\"", keyword: "rather", answer: "Mary protested that she would rather not get married yet." },
  { original: "Mothers must try hard to understand.", keyword: "best", answer: "Mothers must do their best to be understanding." },
  { original: "The younger you marry, the greater the chance you will be unhappy.", keyword: "likely", answer: "The younger you marry, the more likely you are to be unhappy." },
  { original: "I was wrong to argue with him.", keyword: "Mistake", answer: "It was a mistake/I made to argue with him." },
  { original: "It will be better if you get up at 7 a.m. tomorrow.", keyword: "SOONER", answer: "I would sooner you got up at 7 a.m. tomorrow." },
  { original: "I will consider your idea and come back to you with a decision next week.", keyword: "OVER", answer: "I will think over your idea and come back to you with a decision next week." },
  { original: "People are more interested in history than you might expect.", keyword: "LESS", answer: "You would/might expect people to be less interested in history." },
  { original: "For me, imagining what life must have been like then is just not possible.", keyword: "QUITE", answer: "I find it quite impossible to imagine what life must have been like then." },
  { original: "Whatever film you want to see will be good for us.", keyword: "MIND", answer: "We don't mind seeing whatever film you want." },
  { original: "People will always want entertainment, providing that they have the time to enjoy it.", keyword: "LONG", answer: "There will always be a need for entertainment as long as people have the time to enjoy it." },
  { original: "Fog delayed my flight to Moscow this morning.", keyword: "UP", answer: "My flight to Moscow was held up by fog this morning." },
  { original: "The boys found the trip to the science museum fascinating.", keyword: "WERE", answer: "The boys were fascinated by the trip to the science museum." },
  { original: "Maria couldn't eat her soup because it was very hot.", keyword: "TOO", answer: "The soup was too hot for Maria to eat." },
  { original: "He was the kindest person I had ever seen.", keyword: "SUCH", answer: "I had never seen such a kind person before." },
  { original: "He usually sleeps until noon.", keyword: "USED", answer: "He is used to sleeping until noon." },
  { original: "Computers are much cheaper than they were a few years ago.", keyword: "USED", answer: "Computers used to be more expensive a few years ago." },
  { original: "Famous people are always recognised no matter where they go.", keyword: "AVOID", answer: "Famous people can't avoid being recognized no matter where they go." },
  { original: "I found it impossible to finish the task in time.", keyword: "MANAGED", answer: "I couldn't have managed to finish the task in time." },
  { original: "They accused him of stealing the money.", keyword: "CHARGED", answer: "He was charged with stealing the money." },
  { original: "The weather is so bad that the match was postponed.", keyword: "SUCH", answer: "It was such bad weather that the match was postponed." },
  { original: "The last time I met her was at the conference.", keyword: "SINCE", answer: "I haven't met her since the conference." },
  { original: "I am convinced that he will succeed.", keyword: "BELIEVE", answer: "I believe he will succeed." },
  { original: "\"You should take more care with your work,\" she said.", keyword: "ADVISED", answer: "She advised me to take more care with my work." },
  { original: "He was too exhausted to continue working.", keyword: "ENOUGH", answer: "He wasn't strong enough to continue working." },
  { original: "I am sorry that I cannot come to the party.", keyword: "Miss", answer: "I am sorry (that) I shall (have to) miss, to miss the party." },
  { original: "It is pointless to carry samovars to Samarkand.", keyword: "Point", answer: "There is no point (in/to) carrying samovars to Samarkand." },
  { original: "The path was so narrow they had to walk one behind the other along it.", keyword: "single", answer: "The path was so narrow they had to walk in single file along it." },
  { original: "Small children are full of mischief.", keyword: "Sorts", answer: "Small children get up to all sorts of tricks." },
  { original: "\"Can you help me?\" the old lady asked.", keyword: "could", answer: "The old lady asked if I could help her." },
  { original: "When he was much older, he understood.", keyword: "Until", answer: "It was not until he was much older that he understood." },
  { original: "I had just sat down when the meeting started.", keyword: "HARDLY", answer: "Hardly had I sat down when the meeting started." },
  { original: "As soon as she finished the report, she left the office.", keyword: "NO SOONER", answer: "No sooner had she finished the report than she left the office." },
  { original: "He didn't apologize until he realized his mistake.", keyword: "NOT UNTIL", answer: "Not until he realised his mistake did he apologize." },
  { original: "I have never encountered such a problem before.", keyword: "RARELY", answer: "Rarely have I encountered such a problem before." },
  { original: "I didn't realize how serious the situation was.", keyword: "LITTLE", answer: "Little did I realize how serious the situation was." },
  { original: "We understood the importance after the speech ended.", keyword: "ONLY", answer: "Only after the speech ended did we understand the importance." },
  { original: "Although she was exhausted, she continued working.", keyword: "DESPITE", answer: "Despite being exhausted, she continued working." },
  { original: "I prefer to stay at home tonight.", keyword: "WOULD RATHER", answer: "I would rather stay at home tonight." },
  { original: "People say he is very wealthy.", keyword: "SUPPOSED", answer: "He is supposed to be very wealthy." },
  { original: "The weather was so bad that the flight was cancelled.", keyword: "SO", answer: "So bad was the weather that the flight was cancelled." },
  { original: "If I had known, I would have helped.", keyword: "HAD", answer: "Had I known, I would have helped." }
];

export default function TechWritingPractice({ onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentQ = practiceData[currentIndex];
  const totalQ = practiceData.length;

  const handleReveal = () => {
    if (!userInput.trim()) return;
    setShowAnswer(true);
  };

  const handleNext = (isCorrect) => {
    if (isCorrect) setScore(prev => prev + 1);
    
    if (currentIndex + 1 >= totalQ) {
      setCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setUserInput("");
      setShowAnswer(false);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setUserInput("");
    setShowAnswer(false);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">Practice Complete!</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">
          You scored <strong className="text-[#077d8a]">{score}</strong> out of {totalQ}.
        </p>
        <div className="flex gap-4">
          <button onClick={restart} className="px-6 py-3 bg-[#077d8a] text-white font-bold rounded-xl shadow-md hover:bg-[#066d79] transition-all">
            Practice Again
          </button>
          {onBack && (
            <button onClick={onBack} className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">
              Back to Study Hub
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Key Word Transformation
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Technical Writing Grammar Practice
          </p>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-sm font-bold text-slate-400 hover:text-[#077d8a] transition-colors">
            &larr; Back
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 mb-8">
        <div 
          className="bg-gradient-to-r from-[#045c66] to-[#077d8a] h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${(currentIndex / totalQ) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-[#171717] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800">
          <div className="text-xs font-bold text-[#077d8a] uppercase tracking-widest mb-4">
            Question {currentIndex + 1} of {totalQ}
          </div>
          <p className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100 leading-relaxed mb-6">
            {currentQ.original}
          </p>
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Key word:</span>
            <span className="font-black text-rose-600 dark:text-rose-400 tracking-wide">
              {currentQ.keyword.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-[#1a1a1a]">
          {!showAnswer ? (
            <div className="flex flex-col gap-4">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Your Answer:</label>
              <textarea 
                rows="3"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#077d8a]/50 focus:border-[#077d8a] transition-all resize-none"
                placeholder={`Rewrite using "${currentQ.keyword.toUpperCase()}"...`}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReveal();
                  }
                }}
              />
              <button 
                onClick={handleReveal}
                disabled={!userInput.trim()}
                className={`py-4 rounded-xl font-bold transition-all shadow-sm ${
                  userInput.trim() 
                    ? 'bg-[#077d8a] text-white hover:bg-[#066d79] active:scale-[0.98]' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                Reveal Answer
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Comparison Box */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">You Wrote:</span>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">{userInput}</p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 block">Correct Answer:</span>
                  <p className="text-emerald-800 dark:text-emerald-200 font-bold">{currentQ.answer}</p>
                </div>
              </div>

              {/* Self-Grading Actions */}
              <div>
                <p className="text-sm font-bold text-center text-slate-600 dark:text-slate-400 mb-4">Did you get it right?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleNext(false)}
                    className="flex-1 py-3 rounded-xl font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                  >
                    ✕ Missed it
                  </button>
                  <button 
                    onClick={() => handleNext(true)}
                    className="flex-1 py-3 rounded-xl font-bold bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition-colors"
                  >
                    ✓ Got it
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
