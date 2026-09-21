import React, { useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

const TOPICS = [
  "Atomic Structure & Periodic Trends",
  "Stoichiometry & Limiting Reagents",
  "Molecular Geometry & VSEPR",
  "Thermodynamics & Equilibrium"
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

  if (!isOpen) return null;

  const startQuiz = async () => {
    setLoading(true);
    try {
      // Hardcoded to the live worker URL, just like the Tutor Drawer
      const res = await fetch('https://chem-synth-worker.ajamespage.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'quiz', topic: selectedTopic, count: questionCount })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setQuestions(data);
        setCurrentIndex(0);
        setSelectedAnswers({});
        setStep('quiz');
      } else {
        throw new Error("Invalid quiz data received");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate quiz. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswers({ ...selectedAnswers, [currentIndex]: optionIndex });
  };

  const submitQuiz = async () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) correctCount++;
    });
    setScore(correctCount);
    setStep('results');

    // Save to Firestore progress tracking
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
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">CHEM 1211 Collegiate Quiz</h2>
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
              {loading ? "Generating Rigorous Questions..." : "Launch Quiz"}
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
              {questions[currentIndex].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition ${selectedAnswers[currentIndex] === idx ? 'bg-cyan-950 border-cyan-400 text-cyan-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'}`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button 
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="px-4 py-2 bg-slate-800 rounded-xl disabled:opacity-50"
              >
                Previous
              </button>
              {currentIndex < questions.length - 1 ? (
                <button 
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="px-6 py-2 bg-cyan-600 font-bold rounded-xl"
                >
                  Next
                </button>
              ) : (
                <button 
                  onClick={submitQuiz}
                  className="px-6 py-2 bg-emerald-600 font-bold rounded-xl text-white shadow-lg"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="text-center py-6">
            {passed ? (
              <div className="animate-bounce mb-4">
                <span className="text-6xl">🏆</span>
                <h2 className="text-3xl font-black text-emerald-400 mt-2">Victory! Masterclass Achieved</h2>
              </div>
            ) : (
              <div className="mb-4">
                <span className="text-6xl">📚</span>
                <h2 className="text-2xl font-bold text-amber-400 mt-2">Good Effort! Keep Reviewing</h2>
              </div>
            )}
            
            <p className="text-xl text-slate-300 mb-6">You scored <span className="font-bold text-white">{score}</span> out of <span className="font-bold text-white">{questions.length}</span> ({Math.round((score / questions.length) * 100)}%)</p>

            <button
              onClick={() => setStep('config')}
              className="bg-cyan-600 px-6 py-3 rounded-xl font-bold text-white shadow-lg"
            >
              Take Another Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}