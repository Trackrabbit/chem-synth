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
  const [step, setStep] = useState('config'); // 'config' | 'quiz' | 'results'
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);

  const [loadingMessage, setLoadingMessage] = useState("");

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
    }, 2500); // Cycles every 2.5 seconds

    return () => clearInterval(interval);
  }, [loading]);

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
  
  if (!isOpen) return null;

    const startQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://chem-synth-worker.ajamespage.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'quiz', topic: selectedTopic, count: questionCount })
      });
      
      // 1. Check if Cloudflare threw a raw text error (like 524 Timeout)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const rawText = await res.text();
        if (res.status === 524) {
          throw new Error("Timeout: The AI took too long to generate the questions. Try selecting 5 questions instead.");
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
    if (hasAnsweredCurrent) return; // Prevent changing answer after feedback is shown
    
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: optionIndex });
    setHasAnsweredCurrent(true); // Trigger immediate feedback UI
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
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">CHEM 1211 Fundamentals</h2>
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

        {step === 'quiz' && questions.length > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Topic: {selectedTopic}</span>
              <span>Question {currentIndex + 1} of {questions.length}</span>
            </div>
            <h3 className="text-lg font-semibold mb-4 text-white">{questions[currentIndex].prompt}</h3>
            
            <div className="space-y-3 mb-6">
              {questions[currentIndex].options.map((opt, idx) => {
                // Immediate feedback styling logic
                let btnStyle = 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750';
                
                if (hasAnsweredCurrent) {
                  if (idx === questions[currentIndex].correctIndex) {
                    btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200'; // Highlight correct answer
                  } else if (idx === selectedAnswers[currentIndex]) {
                    btnStyle = 'bg-red-950 border-red-500 text-red-300 line-through'; // Cross out wrong guess
                  } else {
                    btnStyle = 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'; // Dim others
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

            {/* Immediate Explanation Box */}
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

        {/* Keeping the detailed review at the end for repetition */}
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