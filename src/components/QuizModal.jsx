import React, { useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import quizBank from '../data/quizBank.json';

const CURRENT_TOPICS = Object.keys(quizBank);
const DIFFICULTIES = ["Easy", "Intermediate", "Hard", "All"];

export default function QuizModal({ isOpen, onClose, user }) {
  const [step, setStep] = useState('config');
  const [selectedTopic, setSelectedTopic] = useState(CURRENT_TOPICS[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [questionCount, setQuestionCount] = useState(5);
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [progressHistory, setProgressHistory] = useState([]);

  React.useEffect(() => {
    if (isOpen) {
      setStep('config');
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setScore(0);
      setHasAnsweredCurrent(false);
    }
  }, [isOpen]);

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

  // Combine current quiz bank topics with any legacy topics from the user's history
  const allHistoricalTopics = progressHistory.map(r => r.topic);
  const uniqueTopics = Array.from(new Set([...CURRENT_TOPICS, ...allHistoricalTopics]));

  const topicsWithData = uniqueTopics.map(topic => {
    const topicHistory = progressHistory
      .filter(r => r.topic === topic)
      .reverse() 
      .slice(-15); 
    return { topic, history: topicHistory };
  }).filter(t => t.history.length > 0);

  if (!isOpen) return null;

  const startQuiz = () => {
    try {
      const topicPool = quizBank[selectedTopic] || [];
      
      const filteredPool = selectedDifficulty === "All" 
        ? topicPool 
        : topicPool.filter(q => q.difficulty === selectedDifficulty);

      if (filteredPool.length === 0) {
        throw new Error(`No ${selectedDifficulty} questions available for this topic. Try another difficulty.`);
      }

      const shuffled = [...filteredPool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

      setQuestions(selected);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setHasAnsweredCurrent(false);
      setStep('quiz');
    } catch (err) {
      alert(err.message);
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
          difficulty: selectedDifficulty,
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
              {CURRENT_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <label className="block mb-2 text-sm text-slate-400">Select Difficulty:</label>
            <div className="flex gap-2 mb-4">
              {DIFFICULTIES.map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`flex-1 py-2 text-sm rounded-xl border transition ${selectedDifficulty === diff ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                >
                  {diff}
                </button>
              ))}
            </div>

            <label className="block mb-2 text-sm text-slate-400">Number of Questions:</label>
            <div className="flex gap-4 mb-6">
              {[5, 10, 15].map(num => (
                <button
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className={`flex-1 py-2 rounded-xl border transition ${questionCount === num ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              onClick={startQuiz}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition min-h-[56px] py-2"
            >
              Launch Quiz
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
                  
                  const polylinePoints = history.map((record, idx) => {
                    const x = history.length === 1 ? 50 : (idx / (history.length - 1)) * 100;
                    const y = 100 - (record.percentage * 0.8 + 10);
                    return `${x},${y}`;
                  }).join(' ');
                  
                  return (
                    <div key={topic} className="bg-slate-950/50 border border-slate-700/50 p-4 rounded-xl">
                      <div className="flex justify-between items-end mb-2">
                        <p className="font-bold text-slate-200 text-sm">{topic}</p>
                        <p className="text-xs text-slate-400">
                          Avg: <span className={`font-bold ${currentAvg >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{currentAvg}%</span>
                        </p>
                      </div>
                      
                      <div className="relative h-16 w-full mt-4 mb-2">
                        <div className="absolute w-full border-t border-dashed border-emerald-500/30" style={{ top: '26%' }}></div>
                        <span className="absolute text-[8px] text-emerald-500/50 -mt-3 right-0">80%</span>

                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                          <polyline
                            points={polylinePoints}
                            fill="none"
                            stroke="#0ea5e9"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {history.map((record, idx) => {
                            const x = history.length === 1 ? 50 : (idx / (history.length - 1)) * 100;
                            const y = 100 - (record.percentage * 0.8 + 10);
                            const passed = record.percentage >= 80;
                            return (
                              <circle 
                                key={idx} 
                                cx={x} cy={y} r="3" 
                                fill={passed ? "#10b981" : "#f59e0b"} 
                                vectorEffect="non-scaling-stroke"
                              />
                            )
                          })}
                        </svg>
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
              <span>Topic: {selectedTopic} ({questions[currentIndex].difficulty})</span>
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