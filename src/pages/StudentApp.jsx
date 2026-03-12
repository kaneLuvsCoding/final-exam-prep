import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AccordionItem from '../components/AccordionItem';

const examSchedule = {
  "Technical Writing": "2026-03-17T00:00:00",
  "Analysis of Algorithm": "2026-03-18T00:00:00",
  "BMIS": "2026-03-19T00:00:00",
  "ERP": "2026-03-20T00:00:00", 
  "Advanced DBMS": "2026-03-23T00:00:00",
  "SQM": "2026-03-24T00:00:00"
};

const geminiModel = "gemini-3-flash-preview";
const MOCK_EXAM_DEFAULT_COUNT = 10;
const MOCK_EXAM_DEFAULT_MINUTES = 20;

const shuffleArray = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

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

  if (/reported as leaked|key was reported as leaked|compromised api key/i.test(apiMessage || rawMessage)) {
    return "Gemini API key was reported as leaked. Generate new keys and update .env (GEMINI_API_KEY and GEMINI_API_KEY_BACKUP), then restart your dev server.";
  }

  if (
    status === "PERMISSION_DENIED" ||
    status === "UNAUTHENTICATED" ||
    code === 401 ||
    code === 403 ||
    /api key not valid|invalid api key|permission denied|forbidden|unauthenticated/i.test(apiMessage || rawMessage)
  ) {
    return "Gemini keys are invalid or restricted. Check Vercel env vars GEMINI_API_KEY and GEMINI_API_KEY_BACKUP, and ensure both keys allow Generative Language API.";
  }

  if (status === "NOT_FOUND" || code === 404) {
    return "The selected Gemini model is not available. Please try another model.";
  }

  if (apiMessage) return apiMessage;
  if (rawMessage) return rawMessage;
  return fallback;
};

const extractGeminiText = (responsePayload) => {
  if (!responsePayload || typeof responsePayload !== "object") return "";

  if (typeof responsePayload.text === "string" && responsePayload.text.trim()) {
    return responsePayload.text.trim();
  }

  const candidates = Array.isArray(responsePayload.candidates)
    ? responsePayload.candidates
    : [];

  const parts = [];
  for (const candidate of candidates) {
    const contentParts = Array.isArray(candidate?.content?.parts)
      ? candidate.content.parts
      : [];

    for (const part of contentParts) {
      if (typeof part?.text === "string" && part.text.trim()) {
        parts.push(part.text.trim());
      }
    }
  }

  return parts.join("\n").trim();
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
  const [studyData, setStudyData] = useState(null);
  const [activeSubject, setActiveSubject] = useState("Technical Writing");

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*, subjects!inner(name), topics!inner(name), answers(*)')
          .order('id', { ascending: true });
          
        if (error) throw error;
        
        const grouped = {};
        data.forEach(q => {
          const sName = q.subjects?.name;
          const tName = q.topics?.name;
          if (!sName || !tName) return;

          if (!grouped[sName]) grouped[sName] = {};
          if (!grouped[sName][tName]) grouped[sName][tName] = [];
          
          let parsedAnswer = q.answer;
          if ((q.type === 'comparison' || !q.answer) && q.answers && q.answers.length > 0) {
            try {
              parsedAnswer = JSON.parse(q.answers[0].answer);
            } catch(e) {
              console.error("Failed to parse JSON answer for student view", e);
            }
          } else if (typeof q.answer === 'string') {
             if (q.answer.includes('<') && q.answer.includes('>')) {
                 parsedAnswer = q.answer;
             } else {
                 parsedAnswer = q.answer.split('\n').filter(l => l.trim() !== '');
             }
          }

          let parsedImages = undefined;
          if (q.images) {
            parsedImages = q.images.split(',').map(s => s.trim()).filter(s => s !== '');
          }
          
          grouped[sName][tName].push({
            id: q.id,
            question: q.question,
            answer: parsedAnswer,
            type: q.type,
            headers: q.headers,
            images: parsedImages,
            pdfLink: q.pdfLink
          });
        });
        
        setStudyData(grouped);
      } catch (err) {
        console.error("DB Fetch Error:", err);
      }
    }
    loadData();
  }, []);

  const subjects = Object.keys(studyData || {}).sort((a, b) => {
    const dateA = new Date(examSchedule[a] || "2099-01-01").getTime();
    const dateB = new Date(examSchedule[b] || "2099-01-01").getTime();
    return dateA - dateB;
  });

  const currentSubject = (studyData && studyData[activeSubject]) ? activeSubject : (subjects[0] || "");
  const subjectData = (studyData && studyData[currentSubject]) ? studyData[currentSubject] : {};
  const isDocument = subjectData?.type === "document";

  const tabs = isDocument ? [] : Object.keys(subjectData || {});
  const [activeTab, setActiveTab] = useState(tabs[0] || "");
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return false;
  });
  
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return false;
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

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  const [now, setNow] = useState(new Date());
  const [isMockExamMode, setIsMockExamMode] = useState(false);
  const [isMockExamStarted, setIsMockExamStarted] = useState(false);
  const [mockQuestionCount, setMockQuestionCount] = useState(MOCK_EXAM_DEFAULT_COUNT);
  const [mockDurationMinutes, setMockDurationMinutes] = useState(MOCK_EXAM_DEFAULT_MINUTES);
  const [mockExamQuestions, setMockExamQuestions] = useState([]);
  const [mockCurrentIndex, setMockCurrentIndex] = useState(0);
  const [mockShowAnswer, setMockShowAnswer] = useState(false);
  const [mockAnswers, setMockAnswers] = useState({});
  const [mockTimeLeftSeconds, setMockTimeLeftSeconds] = useState(0);
  const [mockSubmitted, setMockSubmitted] = useState(false);
  
  const popAudio = useRef(typeof Audio !== "undefined" ? new Audio('/pop.mp3') : null);
  const checkAudios = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
      const newTabs = Object.keys(subjectData || {});
      setActiveTab(newTabs.length > 0 ? newTabs[0] : "");
    }
    setOpenQuestionIndex(null);
    setActiveAiQuestionIndex(null);
    setAiPrompt("");
    setLastAiPrompt("");
    setAiResponse("");
    setAiError("");
    setIsMockExamMode(false);
    setIsMockExamStarted(false);
    setMockExamQuestions([]);
    setMockAnswers({});
    setMockCurrentIndex(0);
    setMockShowAnswer(false);
    setMockTimeLeftSeconds(0);
    setMockSubmitted(false);

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [currentSubject, isDocument, studyData]);

  useEffect(() => {
    setActiveAiQuestionIndex(null);
    setAiPrompt("");
    setLastAiPrompt("");
    setAiResponse("");
    setAiError("");
    setIsMockExamMode(false);
    setIsMockExamStarted(false);
    setMockExamQuestions([]);
    setMockAnswers({});
    setMockCurrentIndex(0);
    setMockShowAnswer(false);
    setMockTimeLeftSeconds(0);
    setMockSubmitted(false);
  }, [activeTab]);

  useEffect(() => {
    if (!isMockExamMode || !isMockExamStarted || mockSubmitted) return undefined;

    if (mockTimeLeftSeconds <= 0) {
      setMockSubmitted(true);
      return undefined;
    }

    const timer = setInterval(() => {
      setMockTimeLeftSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isMockExamMode, isMockExamStarted, mockSubmitted, mockTimeLeftSeconds]);

  const handleToggleQuestion = (index) => {
    const nextOpenIndex = openQuestionIndex === index ? null : index;
    setOpenQuestionIndex(nextOpenIndex);

    if (nextOpenIndex !== null) {
      setActiveAiQuestionIndex(nextOpenIndex);
    }
  };

  const currentQAs = isDocument ? [] : (subjectData?.[activeTab] || []);

  const getQaStorageId = (index) => {
    return `${activeSubject}-${activeTab}-${index}`;
  };

  const currentQaIds = currentQAs.map((_, index) => getQaStorageId(index));
  
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

    const formattedAnswer = formatAnswerForAI(targetQa);
    const userRequest = includeOptionalMessage ? aiPrompt.trim() : "";

    if (includeOptionalMessage && !userRequest) {
      setAiError("Please type your optional message first.");
      return;
    }

    const topicForPrompt = activeTab;

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
      `Topic: ${topicForPrompt}`,
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

    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1024) {
        setIsAiSidebarOpen(true);
      } else {
        setIsMobileAiModalOpen(true);
      }
    }

    try {
      const apiResponse = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: geminiModel,
          prompt
        })
      });

      const responsePayload = await apiResponse.json().catch(() => null);

      if (!apiResponse.ok) {
        throw responsePayload?.error || responsePayload || new Error("Failed to get AI explanation.");
      }

      const output = extractGeminiText(responsePayload);

      if (!output) {
        throw new Error("Gemini returned an empty response.");
      }

      setAiResponse(output);

      if (includeOptionalMessage) {
        setAiPrompt("");
      }
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
    if (!isSoundEnabled) return; 

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
    
    const allCheckedNow = currentQaIds.every((id) => next[id]);
    const allCheckedBefore = currentQaIds.every((id) => memorizedQs[id]);

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
  const memorizedCount = currentQaIds.filter((id) => memorizedQs[id]).length;

  const handleSelectAll = () => {
    const next = { ...memorizedQs };
    currentQAs.forEach((_, index) => {
      const id = getQaStorageId(index);
      next[id] = true;
    });

    setMemorizedQs(next);
    localStorage.setItem('memorizedFinalsData', JSON.stringify(next));
  };

  const handleUnselectAll = () => {
    const next = { ...memorizedQs };
    currentQAs.forEach((_, index) => {
      next[getQaStorageId(index)] = false;
    });
    setMemorizedQs(next);
    localStorage.setItem('memorizedFinalsData', JSON.stringify(next));
  };

  const resetMockExam = () => {
    setIsMockExamStarted(false);
    setMockExamQuestions([]);
    setMockCurrentIndex(0);
    setMockShowAnswer(false);
    setMockAnswers({});
    setMockTimeLeftSeconds(0);
    setMockSubmitted(false);
  };

  const startMockExam = () => {
    const pool = currentQAs.map((qa, index) => ({ ...qa, _mockId: getQaStorageId(index) }));
    if (pool.length === 0) return;

    const desiredCount = Number(mockQuestionCount);
    const desiredMinutes = Number(mockDurationMinutes);
    const totalCount = Number.isFinite(desiredCount) ? Math.max(1, Math.min(pool.length, desiredCount)) : Math.min(pool.length, MOCK_EXAM_DEFAULT_COUNT);
    const totalMinutes = Number.isFinite(desiredMinutes) ? Math.max(1, desiredMinutes) : MOCK_EXAM_DEFAULT_MINUTES;
    const picked = shuffleArray(pool).slice(0, totalCount);

    setMockExamQuestions(picked);
    setMockCurrentIndex(0);
    setMockShowAnswer(false);
    setMockAnswers({});
    setMockTimeLeftSeconds(totalMinutes * 60);
    setMockSubmitted(false);
    setIsMockExamStarted(true);
    setOpenQuestionIndex(null);
  };

  const markCurrentMockQuestion = (isCorrect) => {
    const current = mockExamQuestions[mockCurrentIndex];
    if (!current) return;

    setMockAnswers((prev) => ({ ...prev, [current._mockId]: isCorrect }));
    setMockShowAnswer(false);

    if (mockCurrentIndex >= mockExamQuestions.length - 1) {
      setMockSubmitted(true);
      return;
    }

    setMockCurrentIndex((prev) => prev + 1);
  };

  const submitMockExam = () => {
    setMockSubmitted(true);
  };

  const toggleMockExamMode = () => {
    if (isMockExamMode) {
      setIsMockExamMode(false);
      resetMockExam();
      return;
    }

    setIsMockExamMode(true);
    resetMockExam();
    setIsAiSidebarOpen(false);
    setIsMobileAiModalOpen(false);
  };

  const toggleSound = () => {
    if (!isSoundEnabled) return; 

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

  const exportSessionSummary = () => {
    const totalMemorized = Object.values(memorizedQs).reduce((sum, subject) => {
      return sum + Object.values(subject).reduce((subSum, tab) => subSum + (Array.isArray(tab) ? tab.length : 0), 0);
    }, 0);

    const summary = `
Study Session Summary
=====================

Date: ${new Date().toLocaleString()}
Total Memorized Questions: ${totalMemorized}

Breakdown by Subject:
${Object.entries(memorizedQs).map(([subject, subjectData]) => {
  const subjectTotal = Object.values(subjectData).reduce((sum, tab) => sum + (Array.isArray(tab) ? tab.length : 0), 0);
  return `${subject}: ${subjectTotal} questions`;
}).join('\n')}

Subjects Studied: ${Object.keys(memorizedQs).join(', ') || 'None'}
    `.trim();

    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-session-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const progressPercentage = totalQs > 0 ? (memorizedCount / totalQs) * 100 : 0;
  const mockTotal = mockExamQuestions.length;
  const mockAnsweredCount = Object.keys(mockAnswers).length;
  const mockCorrectCount = Object.values(mockAnswers).filter(Boolean).length;
  const mockWrongCount = mockAnsweredCount - mockCorrectCount;
  const mockSkippedCount = Math.max(0, mockTotal - mockAnsweredCount);
  const mockAccuracy = mockTotal > 0 ? Math.round((mockCorrectCount / mockTotal) * 100) : 0;
  const currentMockQuestion = mockExamQuestions[mockCurrentIndex] || null;
  const mockTimeLabel = `${String(Math.floor(mockTimeLeftSeconds / 60)).padStart(2, '0')}:${String(mockTimeLeftSeconds % 60).padStart(2, '0')}`;
  const topActionButtonClass =
    "inline-flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm border border-white/15 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40";

  if (!studyData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#171717] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#077d8a] mb-4"></div>
        <p className="text-slate-500 font-medium">Loading Study Materials...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#171717] text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden relative">
      
      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* REWARD POP-UP MODAL */}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#171717]/60 dark:bg-[#171717]/80 backdrop-blur-sm transition-all duration-300 ${
          showCompletionModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl transform transition-all text-center duration-300 ${
          showCompletionModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-center gap-2">
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
          
          {/* Logo & Toggles Wrapper */}
          <div className="flex items-center justify-between shrink-0 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-2 drop-shadow-sm mr-2">
                S.T.U.D.Y
              </h1>
              
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className={topActionButtonClass}
                title={isSoundEnabled ? "Mute All Sounds" : "Enable Sounds"}
                aria-label={isSoundEnabled ? "Mute All Sounds" : "Enable Sounds"}
              >
                {isSoundEnabled ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5L6 9H3v6h3l5 4V5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.5 8.5a5 5 0 010 7" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 6a9 9 0 010 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5L6 9H3v6h3l5 4V5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                  </svg>
                )}
              </button>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={topActionButtonClass}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                  </svg>
                )}
              </button>

              {/* Export Summary */}
              <button
                type="button"
                onClick={exportSessionSummary}
                className={topActionButtonClass}
                title="Export Session Summary"
                aria-label="Export Session Summary"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 21h14" />
                </svg>
              </button>

              {!isDocument && (
                <button
                  type="button"
                  onClick={toggleMockExamMode}
                  className={`${topActionButtonClass} ${isMockExamMode ? 'bg-emerald-500/20 border-emerald-200/40' : ''}`}
                  title={isMockExamMode ? "Exit Mock Exam Mode" : "Enter Mock Exam Mode"}
                  aria-label={isMockExamMode ? "Exit Mock Exam Mode" : "Enter Mock Exam Mode"}
                >
                  {isMockExamMode ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h6a1 1 0 011 1v1h2a1 1 0 011 1v13a2 2 0 01-2 2H7a2 2 0 01-2-2V6a1 1 0 011-1h2V4a1 1 0 011-1z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11h6" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15h4" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            
            {/* Mobile Subject Menu Hamburger */}
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
          
          {/* TOPICS NAV - Align Right with padding fix */}
          <div className="overflow-x-auto py-2 px-1 snap-x w-full justify-end">
            <nav className="flex gap-3 min-w-max justify-end">
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
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">

        {/* Desktop Sidebar Icons */}
        <div className="hidden md:flex w-16 h-full shrink-0 border-r border-slate-200/60 dark:border-slate-700/70 bg-white/70 dark:bg-[#171717]/70 backdrop-blur-xl z-20">
          <div className="w-full flex flex-col items-center pt-4">
            <button
              className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-[#077d8a] border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition-all"
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
            className="absolute inset-0 bg-[#171717]/40 z-20 md:hidden backdrop-blur-md transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside className={`absolute md:relative w-[85%] h-full bg-white/90 dark:bg-[#171717]/90 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-700/60 flex flex-col shadow-2xl md:shadow-none z-30 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0 ${
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
                      : 'text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-100 hover:translate-x-1'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </nav>
            
            <div className="mt-auto pt-6">
              <Link 
                to="/admin" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-[#077d8a] transition-all group border border-dashed border-slate-200 dark:border-slate-800 hover:border-[#077d8a]/50"
              >
                <svg className="w-5 h-5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-bold opacity-70 group-hover:opacity-100">Admin Access</span>
              </Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto w-full bg-slate-50/50 dark:bg-slate-950/60 relative hide-scroll">
          
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#077d8a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          <div className={`mx-auto p-4 md:p-10 lg:p-12 relative z-10 ${isDocument ? 'max-w-6xl' : 'max-w-5xl'}`}>
            
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0 border-b border-slate-200/60 dark:border-slate-700/60 pb-8">
              <div className="flex-1">
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                  {isDocument ? "Visual Study Guide" : isMockExamMode ? "Mock Exam" : (activeTab || "Select a Topic")}
                </h2>
                
                <p className="text-slate-500 dark:text-slate-300 mt-3 text-base md:text-lg font-medium flex items-center flex-wrap gap-3">
                  <span className="bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-200 px-2.5 py-0.5 rounded-md text-sm font-bold shadow-sm">
                    {activeSubject}
                  </span> 
                  
                  {isDocument ? subjectData.message : isMockExamMode ? "Timed practice from current topic questions." : "Click to reveal the notes."}
                </p>
              </div>
              
              <div 
                onClick={toggleSound}
                className={`bg-white/80 dark:bg-[#171717]/80 backdrop-blur-sm border-2 text-rose-600 dark:text-rose-300 px-7 py-4 rounded-3xl flex flex-col items-center justify-center shadow-lg w-full md:w-auto md:min-w-[15rem] cursor-pointer hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 select-none group ${
                  isPlaying ? 'border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-rose-200/60' : 'border-rose-100 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-800 hover:border-rose-200 dark:hover:border-rose-500/60 shadow-rose-100/50'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400 dark:text-rose-300 mb-1 font-sans group-hover:text-rose-500 dark:group-hover:text-rose-200 transition-colors flex items-center gap-2">
                  Time Left:
                </span>
                <span className="text-3xl md:text-4xl font-black leading-none tracking-tighter font-mono drop-shadow-sm">
                  {getCountdown(activeSubject)}
                </span>
              </div>
            </header>
            
            {isDocument ? (
              <div className="w-full bg-slate-200 dark:bg-[#171717] rounded-3xl shadow-md border border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col h-[calc(100vh-16rem)] min-h-[500px]">
                <object 
                  data={subjectData.file} 
                  type="application/pdf" 
                  className="w-full h-full flex-1"
                >
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white dark:bg-[#171717]">
                    <div className="text-6xl mb-6">📄</div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">PDF Viewer Blocked</h3>
                    <p className="text-slate-500 dark:text-slate-300 mb-8 max-w-md text-base">
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
                {isMockExamMode ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-[#171717]/80 backdrop-blur-sm p-4 md:p-6 shadow-sm">
                    {!isMockExamStarted ? (
                      <div className="space-y-5">
                        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-semibold">
                          Build a timed exam from this topic. Questions are randomized each time.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex flex-col gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                            Number of Questions (max {totalQs})
                            <input
                              type="number"
                              min={1}
                              max={Math.max(1, totalQs)}
                              value={mockQuestionCount}
                              onChange={(event) => setMockQuestionCount(event.target.value)}
                              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-100"
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                            Duration (minutes)
                            <input
                              type="number"
                              min={1}
                              value={mockDurationMinutes}
                              onChange={(event) => setMockDurationMinutes(event.target.value)}
                              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-700 dark:text-slate-100"
                            />
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={startMockExam}
                            disabled={totalQs === 0}
                            className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${
                              totalQs > 0
                                ? 'bg-[#077d8a] text-white hover:bg-[#066d79]'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            Start Exam
                          </button>
                          <button
                            type="button"
                            onClick={toggleMockExamMode}
                            className="px-5 py-2.5 rounded-xl font-bold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            Question {Math.min(mockCurrentIndex + 1, mockTotal)} / {mockTotal}
                          </div>
                          <div className="inline-flex items-center px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-300 font-black tracking-wide">
                            {mockTimeLabel}
                          </div>
                        </div>

                        {!mockSubmitted && currentMockQuestion && (
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-4 md:p-5">
                            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-snug">
                              {currentMockQuestion.question}
                            </h3>

                            {mockShowAnswer ? (
                              <div className="mt-4 rounded-xl border border-[#077d8a]/30 bg-white dark:bg-[#171717] p-4 space-y-3">
                                {currentMockQuestion.type === "comparison" ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[520px]">
                                      <thead>
                                        <tr className="bg-[#077d8a]/10">
                                          {(currentMockQuestion.headers || []).map((head, idx) => (
                                            <th key={idx} className="p-3 text-[#077d8a] border-b border-[#077d8a]/20 font-bold">
                                              {head}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(currentMockQuestion.answer || []).map((row, rowIdx) => (
                                          <tr key={rowIdx} className="border-b border-slate-100 dark:border-slate-700">
                                            {(row || []).map((cell, cellIdx) => (
                                              <td key={cellIdx} className="p-3 text-slate-700 dark:text-slate-200 font-medium align-top whitespace-pre-line">
                                                {cell}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  (currentMockQuestion.answer || []).map((line, idx) => (
                                    <p key={idx} className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                                      {line}
                                    </p>
                                  ))
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setMockShowAnswer(true)}
                                className="mt-4 px-4 py-2 rounded-lg bg-[#077d8a]/10 text-[#077d8a] border border-[#077d8a]/30 font-bold hover:bg-[#077d8a]/20"
                              >
                                Show Answer
                              </button>
                            )}

                            {mockShowAnswer && (
                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => markCurrentMockQuestion(true)}
                                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600"
                                >
                                  I Got It Right
                                </button>
                                <button
                                  type="button"
                                  onClick={() => markCurrentMockQuestion(false)}
                                  className="px-4 py-2 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600"
                                >
                                  I Got It Wrong
                                </button>
                                <button
                                  type="button"
                                  onClick={submitMockExam}
                                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  Submit Now
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {mockSubmitted && (
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-5 md:p-6">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4">Mock Exam Report</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="rounded-xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-slate-700 p-3">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Score</p>
                                <p className="text-2xl font-black text-[#077d8a]">{mockCorrectCount}/{mockTotal}</p>
                              </div>
                              <div className="rounded-xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-slate-700 p-3">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Accuracy</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-300">{mockAccuracy}%</p>
                              </div>
                              <div className="rounded-xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-slate-700 p-3">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Wrong</p>
                                <p className="text-2xl font-black text-rose-600 dark:text-rose-300">{mockWrongCount}</p>
                              </div>
                              <div className="rounded-xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-slate-700 p-3">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Skipped</p>
                                <p className="text-2xl font-black text-amber-600 dark:text-amber-300">{mockSkippedCount}</p>
                              </div>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={startMockExam}
                                className="px-5 py-2.5 rounded-xl font-bold bg-[#077d8a] text-white hover:bg-[#066d79]"
                              >
                                Retry New Mock
                              </button>
                              <button
                                type="button"
                                onClick={resetMockExam}
                                className="px-5 py-2.5 rounded-xl font-bold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                Back to Setup
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                <>
                {totalQs > 0 && (
                  <div className="flex justify-between items-center mb-4 px-1">
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md transition-colors ${
                        memorizedCount === totalQs ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/20' : 'text-slate-400 dark:text-slate-300'
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
                        className="text-sm font-bold text-slate-400 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-300 transition-colors"
                      >
                        ✕ Unselect All
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 md:gap-8 relative mt-2 pb-24">
                  
                  <div className="flex-1 flex flex-col gap-2">
                    {currentQAs.map((qa, index) => {
                      const qaId = getQaStorageId(index);
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
                        <div className="flex-1 w-full bg-slate-200/80 dark:bg-slate-800/90 rounded-full overflow-hidden flex flex-col justify-end shadow-inner border border-slate-300/50 dark:border-slate-700/70">
                          <div 
                            className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-700 ease-out rounded-full"
                            style={{ height: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 text-[9px] md:text-xs font-black text-slate-400 dark:text-slate-300 text-center">
                          {Math.round(progressPercentage)}%
                        </div>
                      </div>
                    </div>
                  )}

                </div>
                </>
                )}
              </div>
            )}

          </div>
        </main>

        {/* --- DESKTOP AI SIDEBAR --- */}
        {isAiSidebarOpen && (
          <aside className="hidden lg:flex w-[24rem] xl:w-[27rem] h-full bg-white/95 dark:bg-[#171717]/95 backdrop-blur-xl border-l border-slate-200/70 dark:border-slate-700/70 shrink-0 shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="w-full h-full p-4 xl:p-5 flex flex-col">
              <div className="mb-4 pb-4 border-b border-slate-200/80 dark:border-slate-700/80 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#077d8a]/70">AI Chat</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-2 leading-relaxed">
                    Tap ✨ Send to AI on any question card to get Burmese explanation.
                  </p>
                  
                  {/* NEW: VPN Warning Banner */}
                  <div className="mt-3 flex hidden  items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <span className="text-amber-500 text-sm leading-none">⚠️</span>
                    <p className="text-[11px] text-amber-700 leading-snug font-medium">
                      <strong>VPN Required:</strong> Please turn on your VPN to use the AI Coach. 
                      <span className="block mt-0.5 opacity-80">(Note: US locations will NOT work)</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-500 dark:hover:text-rose-300 transition-colors"
                  title="Close AI Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isDocument ? (
                <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-300 text-sm p-4 leading-relaxed">
                  AI explanation is available in question tabs only.
                </div>
              ) : (
                <>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-2">Your Message (Optional)</label>
                  <textarea
                    rows={1}
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder="e.g. exam style answer format နဲ့ရှင်းပြပါ"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-[#077d8a]/30 focus:border-[#077d8a]"
                  />

                  <button
                    type="button"
                    onClick={sendOptionalMessageToAi}
                    disabled={!canSendOptionalMessage}
                    className={`mt-3 w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                      canSendOptionalMessage
                        ? 'bg-[#077d8a] text-white hover:bg-[#066d79] active:scale-[0.99]'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {isAiLoading ? 'Sending...' : 'Send Optional Msg to AI'}
                  </button>

                  <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-300 leading-relaxed">
                    Card ✨ Send to AI and Optional Msg send are separate actions.
                  </p>

                  <div className="mt-4 flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3 overflow-y-auto hide-scroll relative">
                    {!aiResponse && !aiError && !isAiLoading && (
                      <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                        AI response will appear here. This panel keeps only the latest response.
                      </p>
                    )}

                    {isAiLoading && (
                      <p className="text-xs text-[#077d8a] leading-relaxed font-semibold">
                        Gemini is thinking...
                      </p>
                    )}

                    {lastAiPrompt && (
                      <div className="mb-3 p-2.5 rounded-lg bg-white dark:bg-[#171717] border border-slate-200 dark:border-slate-700">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-300 mb-1">You</p>
                        <p className="text-sm text-slate-700 dark:text-slate-100 whitespace-pre-wrap">{lastAiPrompt}</p>
                      </div>
                    )}

                    {aiError && (
                      <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs whitespace-pre-wrap">
                        {aiError}
                      </div>
                    )}

                    {aiResponse && (
                      <div className="p-3 rounded-xl bg-gradient-to-b from-white to-slate-50 border border-[#077d8a]/20 shadow-sm mb-6">
                        <p className="text-[11px] font-black uppercase tracking-wide text-[#077d8a] mb-2">Gemini Study Coach</p>
                        {renderAiResponseForStudy(aiResponse)}
                      </div>
                    )}
                    
                  </div>
                  
                  {/* Footer Attribution */}
                  <div className="mt-3 text-center text-[10px] text-slate-400">
                    <a href="https://www.flaticon.com/free-icons/robot" title="robot icons" target="_blank" rel="noreferrer" className="hover:text-[#077d8a] dark:hover:text-[#58b8c1] transition-colors">
                      Robot icons created by edt.im - Flaticon
                    </a>
                  </div>
                </>
              )}
            </div>
          </aside>
        )}

      </div>

      {/* --- GLOBAL FLOATING AI BUTTON --- */}
      <button
        type="button"
        className={`fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-white dark:bg-[#171717] shadow-2xl border-[3px] border-[#077d8a] hover:scale-105 active:scale-95 transition-all flex items-center justify-center ${
          (isAiSidebarOpen || isMobileAiModalOpen) ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'
        }`}
        onClick={() => {
          if (typeof window !== "undefined" && window.innerWidth >= 1024) {
            setIsAiSidebarOpen(true);
          } else {
            setIsMobileAiModalOpen(true);
          }
        }}
        title="Open AI Study Coach"
      >
        <img src="/robot.png" alt="AI Chat" className="w-9 h-9 object-contain" />
      </button>

      {/* Mobile AI Modal */}
      <div
        className={`lg:hidden fixed inset-0 z-[85] transition-all duration-200 ${
          isMobileAiModalOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-[#171717]/50 backdrop-blur-sm"
          onClick={() => setIsMobileAiModalOpen(false)}
        />

        <div className="relative h-full w-full p-3 flex items-end">
          <div
            className="w-full max-h-[88vh] rounded-2xl bg-white dark:bg-[#171717] border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#077d8a]/70">AI Chat</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
                  Tap ✨ Send to AI on any question card to get Burmese explanation.
                </p>
                
                {/* NEW: VPN Warning Banner */}
                <div className="mt-2 flex hidden items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-2">
                  <span className="text-amber-500 text-xs leading-none">⚠️</span>
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-snug font-medium">
                    <strong>VPN Required:</strong> Please turn on your VPN. 
                    <span className="block mt-0.5 opacity-80">(US locations will NOT work)</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="w-9 h-9 rounded-full bg-rose-500 text-white border border-rose-600 shadow-sm hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center shrink-0 ml-3"
                onClick={() => setIsMobileAiModalOpen(false)}
                title="Close AI Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto hide-scroll flex flex-col h-full">
              {isDocument ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-300 text-sm p-4 leading-relaxed">
                  AI explanation is available in question tabs only.
                </div>
              ) : (
                <>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-2">Your Message (Optional)</label>
                  <textarea
                    rows={1}
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder="e.g. exam style answer format နဲ့ရှင်းပြပါ"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-[#077d8a]/30 focus:border-[#077d8a]"
                  />

                  <button
                    type="button"
                    onClick={sendOptionalMessageToAi}
                    disabled={!canSendOptionalMessage}
                    className={`mt-2 w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                      canSendOptionalMessage
                        ? 'bg-[#077d8a] text-white hover:bg-[#066d79] active:scale-[0.99]'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {isAiLoading ? 'Sending...' : 'Send Optional Msg to AI'}
                  </button>

                  <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-300 leading-relaxed">
                    Card ✨ Send to AI and Optional Msg send are separate actions.
                  </p>

                  <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3 max-h-[48vh] overflow-y-auto hide-scroll">
                    {!aiResponse && !aiError && !isAiLoading && (
                      <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                        AI response will appear here. This panel keeps only the latest response.
                      </p>
                    )}

                    {isAiLoading && (
                      <p className="text-xs text-[#077d8a] leading-relaxed font-semibold">
                        Gemini is thinking...
                      </p>
                    )}

                    {lastAiPrompt && (
                      <div className="mb-3 p-2.5 rounded-lg bg-white dark:bg-[#171717] border border-slate-200 dark:border-slate-700">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-300 mb-1">You</p>
                        <p className="text-sm text-slate-700 dark:text-slate-100 whitespace-pre-wrap">{lastAiPrompt}</p>
                      </div>
                    )}

                    {aiError && (
                      <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs whitespace-pre-wrap">
                        {aiError}
                      </div>
                    )}

                    {aiResponse && (
                      <div className="p-3 rounded-xl bg-gradient-to-b from-white to-slate-50 border border-[#077d8a]/20 shadow-sm mb-2">
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