import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { studyData } from './data/index';
import AccordionItem from './components/AccordionItem';

const examSchedule = {
  "Technical Writing": "2026-03-17T00:00:00",
  "Analysis of Algorithm": "2026-03-18T00:00:00",
  "BMIS": "2026-03-19T00:00:00",
  "ERP": "2026-03-20T00:00:00", 
  "Advanced DBMS": "2026-03-23T00:00:00",
  "SQM": "2026-03-24T00:00:00"
};

const geminiModel = "gemini-3-flash-preview";
const geminiApiKeyPrimary = import.meta.env.VITE_GEMINI_API_KEY;
const geminiApiKeySecondary =
  import.meta.env.VITE_GEMINI_API_KEY_2 || import.meta.env.VITE_GEMINI_API_KEY2;

const geminiApiKeys = [...new Set([geminiApiKeyPrimary, geminiApiKeySecondary].filter(Boolean))];
const geminiClients = geminiApiKeys.map((apiKey) => new GoogleGenAI({ apiKey }));

const formatAnswerForAI = (qa) => {
  if (!qa) return "";

  if (qa.type === "comparison" && Array.isArray(qa.answer)) {
    return qa.answer
      .map((row) => {
        if (!Array.isArray(row)) return String(row);
        return row.filter(Boolean).join(" : ");
      })
      .join("\n");
  }

  if (Array.isArray(qa.answer)) {
    return qa.answer.join("\n");
  }

  return String(qa.answer || "");
};

const parseGeminiErrorPayload = (value) => {
  if (!value) return null;

  if (typeof value === "object") {
    if (value.error && typeof value.error === "object") return value.error;
    if ("status" in value || "code" in value || "message" in value) return value;
  }

  if (typeof value !== "string") return null;

  const parseJson = (input) => {
    try {
      const parsed = JSON.parse(input);
      if (parsed?.error && typeof parsed.error === "object") return parsed.error;
      if (parsed && typeof parsed === "object") return parsed;
      return null;
    } catch {
      return null;
    }
  };

  const trimmed = value.trim();
  const directParsed = parseJson(trimmed);
  if (directParsed) return directParsed;

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return parseJson(trimmed.slice(firstBrace, lastBrace + 1));
  }

  return null;
};

const toReadableAiError = (error) => {
  const fallback = "Unable to get AI explanation right now. Please try again.";
  const rawMessage = typeof error === "string" ? error : error instanceof Error ? error.message : "";

  const payload = parseGeminiErrorPayload(error) || parseGeminiErrorPayload(rawMessage);
  const status = payload?.status;
  const code = Number(payload?.code);
  const apiMessage = payload?.message;

  if (status === "UNAVAILABLE" || code === 503 || /high demand/i.test(apiMessage || rawMessage)) {
    return "Gemini is busy right now because of high demand. Please try again in a moment.";
  }

  if (status === "RESOURCE_EXHAUSTED" || code === 429) {
    return "Too many requests right now. Please wait a moment and retry.";
  }

  if (status === "PERMISSION_DENIED" || code === 403) {
    return "Gemini API key is invalid or does not have permission.";
  }

  if (status === "NOT_FOUND" || code === 404) {
    return "The selected Gemini model is not available. Please try another model.";
  }

  if (apiMessage) return apiMessage;
  if (rawMessage) return rawMessage;
  return fallback;
};

const isRateLimitOrQuotaError = (error) => {
  const rawMessage = typeof error === "string" ? error : error instanceof Error ? error.message : "";
  const payload = parseGeminiErrorPayload(error) || parseGeminiErrorPayload(rawMessage);
  const status = payload?.status;
  const code = Number(payload?.code);
  const message = String(payload?.message || rawMessage || "");

  if (status === "RESOURCE_EXHAUSTED" || code === 429) return true;

  return /(rate.?limit|quota|too many requests|resource has been exhausted|token limit)/i.test(message);
};

const isAuthKeyError = (error) => {
  const rawMessage = typeof error === "string" ? error : error instanceof Error ? error.message : "";
  const payload = parseGeminiErrorPayload(error) || parseGeminiErrorPayload(rawMessage);
  const status = payload?.status;
  const code = Number(payload?.code);

  return status === "PERMISSION_DENIED" || status === "UNAUTHENTICATED" || code === 401 || code === 403;
};

const renderAiInline = (text) => {
  const parts = String(text || "").split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    const isBoldPart = part.startsWith("**") && part.endsWith("**") && part.length > 4;

    if (isBoldPart) {
      return (
        <strong key={`bold-${index}`} className="font-extrabold text-slate-800">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`plain-${index}`}>{part}</span>;
  });
};

const renderAiResponseForStudy = (text) => {
  const lines = String(text || "").split(/\r?\n/);

  return (
    <div className="space-y-2.5">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();

        if (!line) {
          return <div key={`gap-${index}`} className="h-1" />;
        }

        const markdownHeading = line.match(/^\*\*(.+)\*\*:?$/);
        if (markdownHeading) {
          return (
            <h4 key={`heading-md-${index}`} className="text-sm md:text-base font-black text-[#077d8a] tracking-tight">
              {renderAiInline(markdownHeading[1])}
            </h4>
          );
        }

        const hashHeading = line.match(/^#{1,3}\s*(.+)$/);
        if (hashHeading) {
          return (
            <h4 key={`heading-hash-${index}`} className="text-sm md:text-base font-black text-[#077d8a] tracking-tight">
              {renderAiInline(hashHeading[1])}
            </h4>
          );
        }

        const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
        if (numbered) {
          return (
            <div key={`num-${index}`} className="flex items-start gap-2.5 rounded-lg bg-white/80 border border-slate-200/80 px-2.5 py-2">
              <span className="mt-0.5 inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-[#077d8a]/10 text-[#077d8a] text-xs font-black">
                {numbered[1]}
              </span>
              <p className="text-sm md:text-[15px] font-semibold text-slate-700 leading-relaxed">
                {renderAiInline(numbered[2])}
              </p>
            </div>
          );
        }

        const bullet = line.match(/^[-*•]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={`bullet-${index}`} className="flex items-start gap-2.5">
              <span className="mt-1.5 text-[#077d8a] font-black">•</span>
              <p className="text-sm md:text-[15px] font-semibold text-slate-700 leading-relaxed">
                {renderAiInline(bullet[1])}
              </p>
            </div>
          );
        }

        return (
          <p key={`para-${index}`} className="text-sm md:text-[15px] font-semibold text-slate-700 leading-relaxed">
            {renderAiInline(line)}
          </p>
        );
      })}
    </div>
  );
};

export default function StudyHub() {
  const subjects = Object.keys(studyData).sort((a, b) => {
    const dateA = new Date(examSchedule[a] || "2099-01-01").getTime();
    const dateB = new Date(examSchedule[b] || "2099-01-01").getTime();
    return dateA - dateB;
  });

  const [activeSubject, setActiveSubject] = useState("Technical Writing");
  const subjectData = studyData[activeSubject];
  const isDocument = subjectData?.type === "document";
  
  const tabs = isDocument ? [] : Object.keys(subjectData || {});
  const [activeTab, setActiveTab] = useState(tabs[0] || "");
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [activeAiQuestionIndex, setActiveAiQuestionIndex] = useState(null);
  const [isMobileAiModalOpen, setIsMobileAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [lastAiPrompt, setLastAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiError, setAiError] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // NEW: Global Sound Toggle State
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const [checkAudioIndex, setCheckAudioIndex] = useState(1);

  const [memorizedQs, setMemorizedQs] = useState(() => {
    try {
      const saved = localStorage.getItem('memorizedFinalsData');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [now, setNow] = useState(new Date());
  
  // Audio Refs
  const popAudio = useRef(typeof Audio !== "undefined" ? new Audio('/pop.mp3') : null);
  const checkAudios = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof Audio !== "undefined") {
      checkAudios.current = [1, 2, 3, 4, 5, 6, 7, 8].map(num => {
        const audio = new Audio(`/${num}.mp3`);
        audio.preload = "auto";
        return audio;
      });
    }
  }, []);

  useEffect(() => {
    const audioEl = popAudio.current;
    if (audioEl) {
      const handleEnded = () => setIsPlaying(false);
      audioEl.addEventListener('ended', handleEnded);
      return () => audioEl.removeEventListener('ended', handleEnded);
    }
  }, []);

  useEffect(() => {
    if (!isDocument) {
      const newTabs = Object.keys(studyData[activeSubject] || {});
      setActiveTab(newTabs.length > 0 ? newTabs[0] : "");
    }
    setOpenQuestionIndex(null);
    setActiveAiQuestionIndex(null);
    setAiPrompt("");
    setLastAiPrompt("");
    setAiResponse("");
    setAiError("");

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [activeSubject, isDocument]);

  useEffect(() => {
    setActiveAiQuestionIndex(null);
    setAiPrompt("");
    setLastAiPrompt("");
    setAiResponse("");
    setAiError("");
  }, [activeTab]);

  const handleToggleQuestion = (index) => {
    const nextOpenIndex = openQuestionIndex === index ? null : index;
    setOpenQuestionIndex(nextOpenIndex);

    if (nextOpenIndex !== null) {
      setActiveAiQuestionIndex(nextOpenIndex);
    }
  };

  const currentQAs = isDocument ? [] : (subjectData?.[activeTab] || []);
  const askAiForExplanation = async (qaIndex, includeOptionalMessage = false) => {
    if (isDocument) {
      setAiError("AI explanation works only in question tabs.");
      return;
    }

    const targetQa = typeof qaIndex === "number" ? currentQAs[qaIndex] : null;
    if (!targetQa) {
      setAiError("Please choose a question card first.");
      return;
    }

    if (geminiClients.length === 0) {
      setAiError("Missing Gemini API key. Add VITE_GEMINI_API_KEY (and optional VITE_GEMINI_API_KEY_2) in your .env file.");
      return;
    }

    const formattedAnswer = formatAnswerForAI(targetQa);
    const userRequest = includeOptionalMessage ? aiPrompt.trim() : "";

    if (includeOptionalMessage && !userRequest) {
      setAiError("Please type your optional message first.");
      return;
    }

    const prompt = [
      "You are a patient exam tutor.",
      "Explain the selected question and answer in Burmese (Myanmar Unicode).",
      "Keep important technical terms in English when needed.",
      "Keep the response simple, practical, and exam-focused.",
      "Use this structure:",
      "1) အကျဉ်းချုပ်",
      "2) လွယ်ကူသောရှင်းလင်းချက်",
      "3) မှတ်မိလွယ်သောအချက်များ",
      "4) စာမေးပွဲမှာဘယ်လိုဖြေရမလဲ",
      "",
      `Subject: ${activeSubject}`,
      `Topic: ${activeTab}`,
      `Question: ${targetQa.question}`,
      "Answer:",
      formattedAnswer,
      userRequest ? `Extra request from student: ${userRequest}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    setActiveAiQuestionIndex(qaIndex);
    setOpenQuestionIndex(qaIndex);
    setIsAiLoading(true);
    setAiError("");
    setAiResponse("");
    setLastAiPrompt(userRequest || "ဒီ Q&A ကို မြန်မာလိုရှင်းပြပါ");

    try {
      let lastError = null;
      let rateLimitFailureCount = 0;

      for (const client of geminiClients) {
        try {
          const response = await client.models.generateContent({
            model: geminiModel,
            contents: prompt
          });

          const output = (
            typeof response?.text === "function" ? response.text() : response?.text
          )
            ?.toString()
            .trim();

          if (!output) {
            throw new Error("Gemini returned an empty response.");
          }

          setAiResponse(output);

          if (includeOptionalMessage) {
            setAiPrompt("");
          }

          return;
        } catch (error) {
          lastError = error;

          if (isRateLimitOrQuotaError(error)) {
            rateLimitFailureCount += 1;
            continue;
          }

          if (isAuthKeyError(error)) {
            continue;
          }

          break;
        }
      }

      if (rateLimitFailureCount === geminiClients.length) {
        setAiError("AI chat is not available for limited tokens.");
        return;
      }

      throw lastError || new Error("Failed to get AI explanation.");
    } catch (error) {
      setAiError(toReadableAiError(error));
    } finally {
      setIsAiLoading(false);
    }
  };

  const sendOptionalMessageToAi = () => {
    if (activeAiQuestionIndex === null) {
      setAiError("Please open or send one question card first.");
      return;
    }

    askAiForExplanation(activeAiQuestionIndex, true);
  };

  const canSendOptionalMessage =
    activeAiQuestionIndex !== null && aiPrompt.trim().length > 0 && !isAiLoading;

  const playCheckSound = (forceIndex = null) => {
    if (!isSoundEnabled) return; // Prevent sound if muted

    const indexToPlay = forceIndex !== null ? forceIndex : checkAudioIndex;
    
    if (checkAudios.current.length > 0) {
      const audio = checkAudios.current[indexToPlay - 1];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio play failed", e));
      }
    }

    if (forceIndex === null) {
      setCheckAudioIndex(prev => prev >= 7 ? 1 : prev + 1);
    } else if (forceIndex === 8) {
      setCheckAudioIndex(1);
    }
  };

  const toggleMemorized = (qaId) => {
    const isCheckingOn = !memorizedQs[qaId];
    const next = { ...memorizedQs, [qaId]: isCheckingOn };
    
    const allCheckedNow = currentQAs.every((_, idx) => next[`${activeSubject}-${activeTab}-${idx}`]);
    const allCheckedBefore = currentQAs.every((_, idx) => memorizedQs[`${activeSubject}-${activeTab}-${idx}`]);

    if (isCheckingOn) {
      if (allCheckedNow && !allCheckedBefore) {
        playCheckSound(8);
        setShowCompletionModal(true);
      } else {
        playCheckSound();
      }
    }

    setMemorizedQs(next);
    localStorage.setItem('memorizedFinalsData', JSON.stringify(next));
  };

  const totalQs = currentQAs.length;
  const memorizedCount = currentQAs.filter((_, idx) => memorizedQs[`${activeSubject}-${activeTab}-${idx}`]).length;

  const handleSelectAll = () => {
    const next = { ...memorizedQs };
    currentQAs.forEach((_, index) => {
      const id = `${activeSubject}-${activeTab}-${index}`;
      next[id] = true;
    });

    setMemorizedQs(next);
    localStorage.setItem('memorizedFinalsData', JSON.stringify(next));
  };

  const handleUnselectAll = () => {
    const next = { ...memorizedQs };
    currentQAs.forEach((_, index) => {
      next[`${activeSubject}-${activeTab}-${index}`] = false;
    });
    setMemorizedQs(next);
    localStorage.setItem('memorizedFinalsData', JSON.stringify(next));
  };

  const toggleSound = () => {
    if (!isSoundEnabled) return; // Prevent sound if muted

    if (popAudio.current) {
      if (isPlaying) {
        popAudio.current.pause();
        popAudio.current.currentTime = 0;
        setIsPlaying(false);
      } else {
        popAudio.current.play().catch(e => console.log("Audio play failed", e));
        setIsPlaying(true);
      }
    }
  };

  const getCountdown = (subject) => {
    const dateString = examSchedule[subject];
    if (!dateString) return "?";

    const diffTime = new Date(dateString) - now;
    if (diffTime <= 0) return "EXAM DAY!";

    const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
    const m = Math.floor((diffTime / 1000 / 60) % 60);
    const s = Math.floor((diffTime / 1000) % 60);

    return `${totalHours.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const progressPercentage = totalQs > 0 ? (memorizedCount / totalQs) * 100 : 0;

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden relative">
      
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* REWARD POP-UP MODAL */}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 ${
          showCompletionModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className={`bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl transform transition-all text-center duration-300 ${
          showCompletionModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}>
          <h3 className="text-2xl font-black text-slate-800 mb-4 flex items-center justify-center gap-2">
            Sayar Gyi ha
          </h3>
          
          <div className="w-full h-64 rounded-xl overflow-hidden mb-6 relative pointer-events-none">
            <iframe 
              src="https://tenor.com/embed/22731841" 
              className="absolute inset-0 w-full h-full"
              frameBorder="0" 
              allowFullScreen
            ></iframe>
          </div>

          
          <button 
            onClick={() => setShowCompletionModal(false)}
            className="w-full py-4 bg-gradient-to-r from-[#045c66] to-[#077d8a] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            Ok pr!
          </button>
        </div>
      </div>

      {/* Premium Gradient Header */}
      <header className="bg-gradient-to-r from-[#045c66] via-[#077d8a] to-[#0996a6] text-white shadow-lg z-40 shrink-0 border-b border-[#045c66]/30">
        <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Sound Toggle Wrapper */}
          <div className="flex items-center justify-between shrink-0 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-2 drop-shadow-sm">
                E.X.A.M
              </h1>
              
              <button 
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="p-1.5 md:p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm text-sm border border-white/10 shadow-sm focus:outline-none flex items-center justify-center"
                title={isSoundEnabled ? "Mute All Sounds" : "Enable Sounds"}
              >
                {isSoundEnabled ? "🔊" : "🔇"}
              </button>
            </div>
            
            <button 
              className="md:hidden p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm ml-auto"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Hide Subjects Menu" : "Show Subjects Menu"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          <nav className="hide-scroll flex gap-3 overflow-x-auto pb-2 md:pb-0 snap-x w-full md:justify-start">
            <span className="px-5 py-2.5 rounded-full font-bold text-sm bg-white/10 text-white border border-white/20 whitespace-nowrap">
              📚 {activeSubject}
            </span>

            {isDocument ? (
              <span className="px-5 py-2.5 rounded-full font-bold text-sm bg-white/10 text-white border border-white/20">
                📄 Document Mode
              </span>
            ) : (
              tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setOpenQuestionIndex(null);
                  }}
                  className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 whitespace-nowrap snap-start shrink-0 ${
                    activeTab === tab 
                      ? 'bg-white text-[#077d8a] shadow-md scale-105 transform' 
                      : 'bg-[#045c66]/50 text-[#c7f0f4] hover:bg-[#045c66]/80 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))
            )}
          </nav>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">

        <div className="hidden md:flex w-16 h-full shrink-0 border-r border-slate-200/60 bg-white/70 backdrop-blur-xl z-20">
          <div className="w-full flex flex-col items-center pt-4">
            <button
              className="p-2.5 rounded-xl bg-slate-100/90 text-slate-600 hover:bg-white hover:text-[#077d8a] border border-slate-200/80 shadow-sm transition-all"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Hide Subjects Menu" : "Show Subjects Menu"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-slate-900/30 z-20 md:hidden backdrop-blur-md transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside className={`absolute md:relative w-[85%] h-full bg-white/90 backdrop-blur-xl border-r border-slate-200/60 flex flex-col shadow-2xl md:shadow-none z-30 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0 ${
          isSidebarOpen
            ? 'translate-x-0 md:w-72 md:opacity-100'
            : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:border-r-0 md:pointer-events-none'
        }`}>
          <div className="p-6 h-full flex flex-col overflow-y-auto hide-scroll">
            <div className="mb-6 flex justify-between items-center shrink-0">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#077d8a]/60">
                Subjects Library
              </h2>
            </div>
            
            <nav className="flex flex-col gap-2.5">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => {
                    setActiveSubject(subject);
                    setOpenQuestionIndex(null);
                    setIsSidebarOpen(false);
                  }}
                  className={`text-left px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                    activeSubject === subject 
                      ? 'bg-[#077d8a]/10 text-[#077d8a] shadow-sm ring-1 ring-[#077d8a]/30 translate-x-1' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:translate-x-1'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto w-full bg-slate-50/50 relative hide-scroll">
          
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#077d8a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          <div className={`mx-auto p-4 md:p-10 lg:p-12 relative z-10 ${isDocument ? 'max-w-6xl' : 'max-w-5xl'}`}>
            
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0 border-b border-slate-200/60 pb-8">
              <div className="flex-1">
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
                  {isDocument ? "Visual Study Guide" : (activeTab || "Select a Topic")}
                </h2>
                
                <p className="text-slate-500 mt-3 text-base md:text-lg font-medium flex items-center flex-wrap gap-3">
                  <span className="bg-slate-200/70 text-slate-600 px-2.5 py-0.5 rounded-md text-sm font-bold shadow-sm">
                    {activeSubject}
                  </span> 
                  
                  {isDocument ? subjectData.message : "Click to reveal the notes."}
                </p>
              </div>
              
              <div 
                onClick={toggleSound}
                className={`bg-white/80 backdrop-blur-sm border-2 text-rose-600 px-7 py-4 rounded-3xl flex flex-col items-center justify-center shadow-lg w-full md:w-auto md:min-w-[15rem] cursor-pointer hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 select-none group ${
                  isPlaying ? 'border-rose-400 bg-rose-50 shadow-rose-200/60' : 'border-rose-100 hover:bg-rose-50 hover:border-rose-200 shadow-rose-100/50'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-1 font-sans group-hover:text-rose-500 transition-colors flex items-center gap-2">
                  Time Left:
                </span>
                <span className="text-3xl md:text-4xl font-black leading-none tracking-tighter font-mono drop-shadow-sm">
                  {getCountdown(activeSubject)}
                </span>
              </div>
            </header>
            
            {isDocument ? (
              <div className="w-full bg-slate-200 rounded-3xl shadow-md border border-slate-300 overflow-hidden flex flex-col h-[calc(100vh-16rem)] min-h-[500px]">
                <object 
                  data={subjectData.file} 
                  type="application/pdf" 
                  className="w-full h-full flex-1"
                >
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white">
                    <div className="text-6xl mb-6">📄</div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">PDF Viewer Blocked</h3>
                    <p className="text-slate-500 mb-8 max-w-md text-base">
                      Your browser doesn't support embedded PDFs, or the file couldn't be found.
                    </p>
                    <a 
                      href={subjectData.file} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-8 py-4 bg-[#077d8a] text-white rounded-2xl font-bold hover:bg-[#055c66] transition-all shadow-md hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
                    >
                      Open PDF in New Tab
                    </a>
                  </div>
                </object>
              </div>
            ) : (
              <div className="flex flex-col">
                
                {totalQs > 0 && (
                  <div className="flex justify-between items-center mb-4 px-1">
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md transition-colors ${
                        memorizedCount === totalQs ? 'text-emerald-600 bg-emerald-500/10' : 'text-slate-400'
                      }`}>
                        {memorizedCount}/{totalQs} Completed
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={handleSelectAll}
                        className="text-sm font-bold text-[#077d8a] hover:text-[#055c66] transition-colors"
                      >
                        ✓ Select All
                      </button>
                      <button 
                        onClick={handleUnselectAll}
                        className="text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        ✕ Unselect All
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 md:gap-8 relative mt-2">
                  
                  <div className="flex-1 flex flex-col gap-2">
                    {currentQAs.map((qa, index) => {
                      const qaId = `${activeSubject}-${activeTab}-${index}`;
                      return (
                        <AccordionItem
                          key={index}
                          question={qa.question}
                          answer={qa.answer}
                          type={qa.type}
                          headers={qa.headers}
                          images={qa.images}
                          pdfLink={qa.pdfLink}
                          isOpen={openQuestionIndex === index}
                          onClick={() => handleToggleQuestion(index)}
                          isMemorized={!!memorizedQs[qaId]}
                          onToggleMemorized={() => toggleMemorized(qaId)}
                          onSendToAi={() => askAiForExplanation(index)}
                          isAiSelected={activeAiQuestionIndex === index}
                          isSendingToAi={isAiLoading && activeAiQuestionIndex === index}
                        />
                      );
                    })}
                  </div>

                  {totalQs > 0 && (
                    <div className="w-1.5 md:w-5 flex-shrink-0 flex flex-col items-center">
                      <div className="sticky top-6 h-[35vh] md:h-[calc(100vh-20rem)] min-h-[150px] md:min-h-[300px] flex flex-col items-center">
                        <div className="flex-1 w-full bg-slate-200/80 rounded-full overflow-hidden flex flex-col justify-end shadow-inner border border-slate-300/50">
                          <div 
                            className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-700 ease-out rounded-full"
                            style={{ height: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 text-[9px] md:text-xs font-black text-slate-400 text-center">
                          {Math.round(progressPercentage)}%
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        </main>

        <aside className="hidden lg:flex w-[24rem] xl:w-[27rem] h-full bg-white/95 backdrop-blur-xl border-l border-slate-200/70 shrink-0">
          <div className="w-full h-full p-4 xl:p-5 flex flex-col">
            <div className="mb-4 pb-4 border-b border-slate-200/80">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#077d8a]/70">AI Chat</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tap ✨ Send to AI on any question card to get Burmese explanation.
              </p>
            </div>

            {isDocument ? (
              <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 text-sm p-4 leading-relaxed">
                AI explanation is available in question tabs only.
              </div>
            ) : (
              <>
                <label className="text-xs font-bold text-slate-500 mt-4 mb-2">Your Message (Optional)</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder="e.g. exam style answer format နဲ့ရှင်းပြပါ"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#077d8a]/30 focus:border-[#077d8a]"
                />

                <button
                  type="button"
                  onClick={sendOptionalMessageToAi}
                  disabled={!canSendOptionalMessage}
                  className={`mt-3 w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                    canSendOptionalMessage
                      ? 'bg-[#077d8a] text-white hover:bg-[#066d79] active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isAiLoading ? 'Sending...' : 'Send Optional Msg to AI'}
                </button>

                <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                  Card ✨ Send to AI and Optional Msg send are separate actions.
                </p>

                <div className="mt-4 flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 overflow-y-auto hide-scroll">
                  {!aiResponse && !aiError && !isAiLoading && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      AI response will appear here. This panel keeps only the latest response.
                    </p>
                  )}

                  {isAiLoading && (
                    <p className="text-xs text-[#077d8a] leading-relaxed font-semibold">
                      Gemini is thinking...
                    </p>
                  )}

                  {lastAiPrompt && (
                    <div className="mb-3 p-2.5 rounded-lg bg-white border border-slate-200">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">You</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{lastAiPrompt}</p>
                    </div>
                  )}

                  {aiError && (
                    <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs whitespace-pre-wrap">
                      {aiError}
                    </div>
                  )}

                  {aiResponse && (
                    <div className="p-3 rounded-xl bg-gradient-to-b from-white to-slate-50 border border-[#077d8a]/20 shadow-sm">
                      <p className="text-[11px] font-black uppercase tracking-wide text-[#077d8a] mb-2">Gemini Study Coach</p>
                      {renderAiResponseForStudy(aiResponse)}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>

      </div>

      <button
        type="button"
        className="lg:hidden fixed bottom-5 right-4 z-40 w-14 h-14 rounded-full bg-[#077d8a] text-white shadow-lg border border-[#06606a] active:scale-95 transition-all flex items-center justify-center"
        onClick={() => setIsMobileAiModalOpen((prev) => !prev)}
        title={isMobileAiModalOpen ? "Hide AI Chat" : "Show AI Chat"}
      >
        <span className="text-2xl leading-none" aria-hidden="true">🤖</span>
      </button>

      <div
        className={`lg:hidden fixed inset-0 z-[85] transition-all duration-200 ${
          isMobileAiModalOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setIsMobileAiModalOpen(false)}
        />

        <div className="relative h-full w-full p-3 flex items-end">
          <div
            className="w-full max-h-[88vh] rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#077d8a]/70">AI Chat</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Tap ✨ Send to AI on any question card to get Burmese explanation.
                </p>
              </div>

              <button
                type="button"
                className="w-9 h-9 rounded-full bg-rose-500 text-white border border-rose-600 shadow-sm hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center"
                onClick={() => setIsMobileAiModalOpen(false)}
                title="Close AI Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto hide-scroll">
              {isDocument ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 text-sm p-4 leading-relaxed">
                  AI explanation is available in question tabs only.
                </div>
              ) : (
                <>
                  <label className="text-xs font-bold text-slate-500 mb-2">Your Message (Optional)</label>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder="e.g. exam style answer format နဲ့ရှင်းပြပါ"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#077d8a]/30 focus:border-[#077d8a]"
                  />

                  <button
                    type="button"
                    onClick={sendOptionalMessageToAi}
                    disabled={!canSendOptionalMessage}
                    className={`mt-3 w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                      canSendOptionalMessage
                        ? 'bg-[#077d8a] text-white hover:bg-[#066d79] active:scale-[0.99]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isAiLoading ? 'Sending...' : 'Send Optional Msg to AI'}
                  </button>

                  <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                    Card ✨ Send to AI and Optional Msg send are separate actions.
                  </p>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 max-h-[52vh] overflow-y-auto hide-scroll">
                    {!aiResponse && !aiError && !isAiLoading && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        AI response will appear here. This panel keeps only the latest response.
                      </p>
                    )}

                    {isAiLoading && (
                      <p className="text-xs text-[#077d8a] leading-relaxed font-semibold">
                        Gemini is thinking...
                      </p>
                    )}

                    {lastAiPrompt && (
                      <div className="mb-3 p-2.5 rounded-lg bg-white border border-slate-200">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">You</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{lastAiPrompt}</p>
                      </div>
                    )}

                    {aiError && (
                      <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs whitespace-pre-wrap">
                        {aiError}
                      </div>
                    )}

                    {aiResponse && (
                      <div className="p-3 rounded-xl bg-gradient-to-b from-white to-slate-50 border border-[#077d8a]/20 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wide text-[#077d8a] mb-2">Gemini Study Coach</p>
                        {renderAiResponseForStudy(aiResponse)}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}