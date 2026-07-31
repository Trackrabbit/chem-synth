import React, { useState, useEffect } from 'react';
import { X, ThermometerSun, AlertTriangle, ShieldCheck, AlertCircle, BookOpen } from 'lucide-react';
import MolecularViewer from './MolecularViewer';

const StatBox = ({ label, value, icon: Icon, colorClass = "text-slate-200", bgClass = "bg-slate-950/50" }) => (
  <div className={`p-4 rounded-xl border border-slate-800/60 ${bgClass} flex flex-col justify-center`}>
    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
      {label}
    </span>
    <div className={`font-medium flex items-center gap-2 ${colorClass}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {value}
    </div>
  </div>
);

const DatasheetModal = ({ item, onClose, children, appMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [item]);

  if (!item) return null;

  // Determine Hazard UI colors
  let HazardIcon = ShieldCheck;
  let hazardColor = "text-emerald-400";
  let hazardBg = "bg-emerald-500/10 border-emerald-500/20";
  
  if (item.hazardLevel === 'Danger') {
    HazardIcon = AlertTriangle;
    hazardColor = "text-rose-400";
    hazardBg = "bg-rose-500/10 border-rose-500/20";
  } else if (item.hazardLevel === 'Caution') {
    HazardIcon = AlertCircle;
    hazardColor = "text-amber-400";
    hazardBg = "bg-amber-500/10 border-amber-500/20";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-slate-950/80 animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Pinned Header */}
        <div className="flex items-start justify-between p-6 pb-4 flex-shrink-0 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-white/10"
              style={{ backgroundColor: item.color || '#334155' }}
            >
              {item.emoji || '🧪'}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{item.name}</h2>
              {item.formula && item.formula !== "N/A" && (
                <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mt-1">
                  {item.formula}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8">
          
          <div className="rounded-xl overflow-hidden ring-1 ring-slate-800">
            <MolecularViewer item={item} />
          </div>
          
          {/* Alchemical Grimoire (Only Fantasy Mode) */}
          {appMode?.toLowerCase() === 'fantasy' && item.lore && (
            <div className="bg-purple-900/10 rounded-xl p-5 border border-purple-500/20">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Alchemical Grimoire
              </h4>
              <p className="italic text-slate-300 text-sm leading-relaxed mb-3">"{item.lore}"</p>
              <div className="grid grid-cols-1 gap-2 text-sm text-purple-300">
                <p><strong>Properties:</strong> {item.properties}</p>
                <p><strong>Usage:</strong> {item.usage}</p>
              </div>
            </div>
          )}

          {/* Properties Grid */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                Physical Properties
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Molar Mass" value={item.molarMass !== "N/A" ? `${item.molarMass} g/mol` : 'N/A'} colorClass="font-mono text-slate-200"/>
                <StatBox label="State at STP" value={item.state || item.type || 'Unknown'} colorClass="capitalize text-slate-200"/>
                <StatBox label="VSEPR Geometry" value={item.geometry || 'N/A'} colorClass="text-slate-200"/>
                <StatBox label="ΔH_f° (Enthalpy)" value={item.enthalpy !== undefined ? `${item.enthalpy} kJ/mol` : 'N/A'} colorClass="font-mono text-slate-200"/>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                Chemical Properties
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Oxidation States" value={item.oxidationStates || 'N/A'} colorClass="font-mono text-slate-200"/>
                <StatBox label="pH Level (Aqueous)" value={item.pH || 'N/A'} colorClass="font-mono text-slate-200"/>
                <StatBox label="Thermochemistry" value={item.isExothermic ? 'Exothermic' : 'Endothermic / Neutral'} icon={item.isExothermic ? ThermometerSun : null} colorClass={item.isExothermic ? "text-red-400" : "text-slate-200"}/>
                <StatBox label="Hazard Level" value={item.hazardLevel || 'Unknown'} icon={HazardIcon} colorClass={hazardColor} bgClass={hazardBg}/>
              </div>
            </div>
          </div>

          {/* Lab Notes (General) */}
          {item.description && (
            <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800/60">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Lab Notes
              </h4>
              <div className="relative">
                <p className={`text-slate-300 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}>
                  {item.description}
                </p>
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-3 text-emerald-400 hover:text-emerald-300 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40"
                >
                  {isExpanded ? 'Collapse Analysis' : 'Read Full Analysis'}
                </button>
              </div>
            </div>
          )}

          {children && (
            <div className="border-t border-slate-800 pt-6">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatasheetModal;