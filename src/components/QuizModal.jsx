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

  if (!isOpen) return null;

  const startQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://chem-synth-worker.ajamespage.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'quiz', topic: selectedTopic, count: questionCount })
      });
      
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
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 py-3 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition"
            >
              {loading ? "Generating Quiz..." : "Launch Quiz"}
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
              <div className="mb-6 p-4 rounded-xl bg-slate-950/50 border border-slate-700/50 text-sm text-cyan-100">
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