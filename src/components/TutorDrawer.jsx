import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, GraduationCap } from 'lucide-react';
import { useLab } from '../context/LabProvider';

const TutorDrawer = ({ isOpen, onClose, workbenchState }) => {
  const { chatHistory, addMessage } = useLab();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    
    // 1. Add user message to global context
    addMessage('user', userText);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('https://chem-synth-worker.ajamespage.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'tutor',
          workbenchContext: workbenchState,
          studentMessage: userText
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      
      // 2. Add tutor response to global context
      addMessage('tutor', data.text);
    } catch (error) {
      console.error("Tutor Error:", error);
      addMessage('tutor', 'Sorry, I am having trouble connecting to the chemistry lab server right now. Please check your connection and try again!');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div 
      className={`fixed top-0 right-0 h-screen w-96 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-white tracking-wide">Chem Lab Tutor</h2>
            <p className="text-xs text-emerald-400/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Socratic Mode Active
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/30">
        {chatHistory.map((msg, index) => (
          <div 
            key={index} 
            className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
              msg.role === 'user' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm shadow-md'
                : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50 shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700/50 rounded-tl-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 pb-24 border-t border-slate-800 bg-slate-900 flex-shrink-0">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-end gap-2 bg-slate-950 border border-slate-700 rounded-xl p-1 shadow-inner focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all"
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Ask about your workbench..."
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 text-sm p-3 resize-none focus:outline-none custom-scrollbar max-h-32 min-h-[44px]"
            rows="1"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="p-3 text-emerald-400 hover:text-white hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-emerald-400 rounded-lg transition-colors mb-0.5 mr-0.5"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TutorDrawer;