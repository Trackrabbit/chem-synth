import React, { useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

const TOPICS = [
  "Element Names & Symbols",
  "Atomic Structure (Protons, Neutrons, Electrons)",
  "Ions, Isotopes & Charges",
  "Basic Chemical Bonding & Formulas"
];

export default function QuizModal({ isOpen, onClose, user }) {
  const [step, setStep] = useState('config'); // 'config' | 'quiz' | 'results' | 'stats'
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progressHistory, setProgressHistory] = useState([]);

  // Cycle funny loading messages
  React.useEffect(() => {
    if (!loading) return;

    const messages = [
        "Bribing the lab TA...",
        "Searching for the limiting reagent...",
        "Waiting for the reaction to reach equilibrium...",
        "Scrubbing the Erlenmeyer flasks...",
        "Calculating the molar mass of your patience...",
        "Waking up the chemistry professor...",
        "Double-checking Avogadro's number...",
        "Brewing more coffee for the 8 AM lecture...",
        "Consulting the periodic table for inspiration...",
        "Counting the number of protons in your soul...",
        "Asking the electrons to behave...",
        "Mixing the right amount of curiosity and caffeine...",
        "Waiting for the lab rats to finish their experiments...",
        "Calculating the half-life of your attention span...",
        "Attempting to balance the chemical equations of life...",
        "Consulting the ghost of Marie Curie for guidance...",
        "Searching for the elusive noble gas of motivation...",
        "Asking the molecules to form a conga line...",
        "Waiting for the chemical reaction to finish its TikTok dance...",
        "Consulting the periodic table for a pep talk...",
        "Calculating the pH of your enthusiasm...",
        "Waiting for the lab equipment to stop judging you...",
        "Walking to Chik-fil-A for a quick study break...",
    ];
    
    let i = Math.floor(Math.random() * messages.length);
    setLoadingMessage(messages[i]);
    
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
    }, 3500); // Cycles every 3.5 seconds

    return () => clearInterval(interval);
  }, [loading]);

  // Reset quiz state every time the modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setStep('config');
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setScore(0);
      setHasAnsweredCurrent(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Fetch Firestore history when modal opens or a quiz finishes
  React.useEffect(() => {
    if (isOpen && user) {
      const fetchHistory = async () => {
        const statsRef = doc(db, 'users', user.uid, 'stats', 'quiz_progress');
        try {
          const snap = await getDoc(statsRef);
          if (snap.exists() && snap.data().history) {
            setProgressHistory(snap.data().history.reverse());
          }
        } catch (e) {
          console.error("Error fetching history:", e);
        }
      };
      fetchHistory();
    }
  }, [isOpen, user, step]);

  // Group and format history for sparklines (left-to-right chronological order)
  const topicsWithData = TOPICS.map(topic => {
    const topicHistory = progressHistory
      .filter(r => r.topic === topic)
      .reverse() // progressHistory is newest-first; reverse to oldest-first for the graph
      .slice(-15); // Keep the 15 most recent attempts
    return { topic, history: topicHistory };
  }).filter(t => t.history.length > 0);

  if (!isOpen) return null;

  const startQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://chem-synth-worker.ajamespage.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'quiz', topic: selectedTopic, count: questionCount })
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const rawText = await res.text();
        if (res.status === 524) {
          throw new Error("Timeout: The AI server took too long to generate the questions. Try selecting 5 questions instead or wait a bit longer.");
        }
        throw new Error(`Server Error: ${rawText.substring(0, 50)}...`);
      }

      const data = await res.json();
      
      if (data.error) throw new Error(`Worker Error: ${data.error}`);
      
      if (Array.isArray(data)) {
        setQuestions(data);
        setCurrentIndex(0);
        setSelectedAnswers({});
        setHasAnsweredCurrent(false);
        setStep('quiz');
      } else {
        throw new Error("Invalid quiz data received");
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionIndex) => {
    if (hasAnsweredCurrent) return; 
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: optionIndex });
    setHasAnsweredCurrent(true); 
  };

  const handleNext = () => {
    setHasAnsweredCurrent(false);
    setCurrentIndex(prev => prev + 1);
  };

  const submitQuiz = async () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) correctCount++;
    });
    setScore(correctCount);
    setStep('results');

    if (user) {
      const statsRef = doc(db, 'users', user.uid, 'stats', 'quiz_progress');
      try {
        const snap = await getDoc(statsRef);
        const newRecord = {
          topic: selectedTopic,
          score: correctCount,
          total: questions.length,
          percentage: (correctCount / questions.length) * 100,
          timestamp: new Date().toISOString()
        };
        if (snap.exists()) {
          await updateDoc(statsRef, { history: arrayUnion(newRecord) });
        } else {
          await setDoc(statsRef, { history: [newRecord] });
        }
      } catch (e) {
        console.error("Error saving progress:", e);
      }
    }
  };

  const passed = score / questions.length >= 0.8;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 text-slate-200 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>

        {step === 'config' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">CHEM 1211 Quizinator</h2>
              {user && progressHistory.length > 0 && (
                <button 
                  onClick={() => setStep('stats')} 
                  className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  📊 View History
                </button>
              )}
            </div>
            
            <label className="block mb-2 text-sm text-slate-400">Select Study Area:</label>
            <select 
              value={selectedTopic} 
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl mb-4 text-white"
            >
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="block mb-2 text-sm text-slate-400">Number of Questions:</label>
            <div className="flex gap-4 mb-6">
              {[5, 10, 15].map(num => (
                <button
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className={`flex-1 py-2 rounded-xl border ${questionCount === num ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
                >
                  {num} Questions
                </button>
              ))}
            </div>

            <button
              onClick={startQuiz}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition flex flex-col items-center justify-center min-h-[56px] py-2"
            >
              {loading ? (
                <>
                  <span className="text-sm font-semibold opacity-90 animate-pulse">Synthesizing Questions...</span>
                  <span className="text-xs font-normal italic text-cyan-200 mt-0.5">{loadingMessage}</span>
                </>
              ) : (
                <span className="text-base py-1">Launch Quiz</span>
              )}
            </button>
          </div>
        )}

        {step === 'stats' && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-cyan-400 border-b border-slate-700 pb-2">Topic Progress Tracker</h2>
            
            <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 mb-6">
              {topicsWithData.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No quiz history available yet.</p>
              ) : (
                topicsWithData.map(({ topic, history }) => {
                  const currentAvg = Math.round(history.reduce((sum, r) => sum + r.percentage, 0) / history.length);
                  
                  return (
                    <div key={topic} className="bg-slate-950/50 border border-slate-700/50 p-4 rounded-xl">
                      <div className="flex justify-between items-end mb-4">
                        <p className="font-bold text-slate-200 text-sm">{topic}</p>
                        <p className="text-xs text-slate-400">
                          Avg: <span className={`font-bold ${currentAvg >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{currentAvg}%</span>
                        </p>
                      </div>
                      
                      {/* Flexbox Sparkline Graph */}
                      <div className="flex items-end gap-1.5 h-16 w-full border-b border-slate-800">
                        {history.map((record, idx) => {
                          const passed = record.percentage >= 80;
                          return (
                            <div key={idx} className="group relative flex-1 flex flex-col justify-end h-full">
                              {/* Hover Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 transition-opacity drop-shadow-md border border-slate-600">
                                {Math.round(record.percentage)}%
                              </div>
                              {/* Graph Bar */}
                              <div 
                                style={{ height: `${Math.max(record.percentage, 4)}%` }} 
                                className={`w-full rounded-t-sm transition-all duration-300 ${passed ? 'bg-emerald-500/80 hover:bg-emerald-400' : 'bg-amber-500/80 hover:bg-amber-400'}`}
                              ></div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-1 uppercase tracking-wider">
                        <span>Older</span>
                        <span>Recent</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setStep('config')}
              className="w-full bg-slate-800 py-3 rounded-xl font-bold text-slate-300 shadow-lg hover:bg-slate-700 transition"
            >
              Back to Quizinator
            </button>
          </div>
        )}

        {step === 'quiz' && questions.length > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Topic: {selectedTopic}</span>
              <span>Question {currentIndex + 1} of {questions.length}</span>
            </div>
            <h3 className="text-lg font-semibold mb-4 text-white">{questions[currentIndex].prompt}</h3>
            
            <div className="space-y-3 mb-6">
              {questions[currentIndex].options.map((opt, idx) => {
                let btnStyle = 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750';
                
                if (hasAnsweredCurrent) {
                  if (idx === questions[currentIndex].correctIndex) {
                    btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200'; 
                  } else if (idx === selectedAnswers[currentIndex]) {
                    btnStyle = 'bg-red-950 border-red-500 text-red-300 line-through'; 
                  } else {
                    btnStyle = 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'; 
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnsweredCurrent}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {hasAnsweredCurrent && (
              <div className={`mb-6 p-4 rounded-xl bg-slate-950/50 border text-sm ${
                selectedAnswers[currentIndex] === questions[currentIndex].correctIndex 
                  ? 'border-emerald-500/50 text-emerald-50' 
                  : 'border-red-500/50 text-red-50'
              }`}>
                <div className={`font-bold mb-2 text-base ${
                  selectedAnswers[currentIndex] === questions[currentIndex].correctIndex 
                    ? 'text-emerald-400' 
                    : 'text-red-400'
                }`}>
                  {selectedAnswers[currentIndex] === questions[currentIndex].correctIndex 
                    ? '✅ Correct!' 
                    : '❌ Not quite.'}
                </div>
                <span className="font-bold text-cyan-400 mr-2">Explanation:</span> 
                {questions[currentIndex].explanation}
              </div>
            )}

            <div className="flex justify-end">
              {!hasAnsweredCurrent ? (
                <button disabled className="px-6 py-2 bg-slate-800 text-slate-500 font-bold rounded-xl">
                  Select an Answer
                </button>
              ) : currentIndex < questions.length - 1 ? (
                <button onClick={handleNext} className="px-6 py-2 bg-cyan-600 font-bold rounded-xl text-white">
                  Next Question
                </button>
              ) : (
                <button onClick={submitQuiz} className="px-6 py-2 bg-emerald-600 font-bold rounded-xl text-white shadow-lg">
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="py-2 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="text-center mb-8">
              {passed ? (
                <div className="animate-bounce mb-2">
                  <span className="text-5xl">🏆</span>
                  <h2 className="text-2xl font-black text-emerald-400 mt-2">Masterclass Achieved</h2>
                </div>
              ) : (
                <div className="mb-2">
                  <span className="text-5xl">📚</span>
                  <h2 className="text-xl font-bold text-amber-400 mt-2">Keep Reviewing</h2>
                </div>
              )}
              <p className="text-lg text-slate-300">
                You scored <span className="font-bold text-white">{score}</span> out of <span className="font-bold text-white">{questions.length}</span> ({Math.round((score / questions.length) * 100)}%)
              </p>
            </div>

            <div className="space-y-6 mb-8">
              <h3 className="text-lg font-bold text-cyan-400 border-b border-slate-700 pb-2">Final Review</h3>
              {questions.map((q, idx) => {
                const isCorrect = selectedAnswers[idx] === q.correctIndex;
                return (
                  <div key={idx} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-950/30 border-emerald-800/50' : 'bg-red-950/30 border-red-800/50'}`}>
                    <p className="font-semibold text-white mb-3 text-sm">{idx + 1}. {q.prompt}</p>
                    <div className="space-y-1.5 mb-3">
                      {q.options.map((opt, optIdx) => {
                        let colorClass = "text-slate-400";
                        if (optIdx === q.correctIndex) colorClass = "text-emerald-400 font-bold";
                        else if (optIdx === selectedAnswers[idx] && !isCorrect) colorClass = "text-red-400 line-through";
                        return <div key={optIdx} className={`text-sm ${colorClass}`}>• {opt}</div>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => setStep('config')} className="w-full bg-cyan-600 py-3 rounded-xl font-bold text-white shadow-lg">
              Take Another Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}