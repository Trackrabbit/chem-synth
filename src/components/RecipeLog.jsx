import React from 'react';
import { X, BookOpen, Flame, Gauge } from 'lucide-react';
import ChemicalGraphic from './ChemicalGraphic';

const RecipeLog = ({ isVisible, inventory, onClose }) => {
  if (!isVisible) return null;

  const synthesizedItems = inventory.filter(item => item.parents && item.parents.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[80vh]" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" /> Synthesis Log
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-900/50">
          {synthesizedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>No successful syntheses recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {synthesizedItems.map(item => (
                <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="shrink-0 w-16 h-16 flex items-center justify-center bg-slate-900 rounded-lg border border-slate-800 shadow-inner">
                     <ChemicalGraphic color={item.color} type={item.type || item.state} size="sm" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg leading-tight">{item.name}</h3>
                    
                    {/* The Recipe Display */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-slate-400 font-medium bg-slate-900/80 px-2 py-1.5 rounded-md border border-slate-800/50 inline-flex">
                      
                      {/* Parent 1 */}
                      <span>{item.parents[0]?.qty || 1}x {item.parents[0]?.name}</span>
                      
                      <span className="text-slate-600">+</span>
                      
                      {/* Parent 2 */}
                      <span>{item.parents[1]?.qty || 1}x {item.parents[1]?.name}</span>
                      
                      {/* Environmental Conditions */}
                      {(item.environment?.heat || item.environment?.pressure) && (
                        <>
                          <span className="text-slate-600 ml-1 flex items-center gap-1 border-l border-slate-700 pl-2">
                            w/
                          </span>
                          {item.environment?.heat && (
                            <Flame className="w-4 h-4 text-orange-400" title="Heat / Spark Applied" />
                          )}
                          {item.environment?.pressure && (
                            <Gauge className="w-4 h-4 text-blue-400" title="High Pressure Applied" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeLog;