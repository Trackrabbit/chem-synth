import React from 'react';

const RecipeLog = ({ isVisible, inventory, onClose }) => {
  if (!isVisible) return null;

  // Filter out starting elements (they don't have parents)
  const discoveredItems = inventory.filter(item => item.parents);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] p-8 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl flex flex-col">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">Recipe History</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {discoveredItems.length === 0 ? (
            <p className="text-slate-400 text-center py-10 italic">No elements discovered yet. Start mixing!</p>
          ) : (
            discoveredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
                
                {/* The Recipe (Parents) */}
                <div className="flex items-center space-x-3 text-lg">
                  <span className="text-2xl">{item.parents[0].emoji}</span>
                  <span className="text-slate-300">{item.parents[0].name}</span>
                  <span className="text-slate-500 font-bold">+</span>
                  <span className="text-2xl">{item.parents[1].emoji}</span>
                  <span className="text-slate-300">{item.parents[1].name}</span>
                </div>

                {/* The Result */}
                <div className="flex items-center space-x-4">
                  <span className="text-slate-500 text-xl font-bold">=</span>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="font-bold text-indigo-400">{item.name}</span>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeLog;