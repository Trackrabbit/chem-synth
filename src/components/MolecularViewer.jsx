import React, { useState, useEffect, useRef } from 'react';
import * as $3Dmol from '3dmol';
import { Info } from 'lucide-react';
import { useLab } from '../context/LabProvider';

const MolecularViewer = ({ item }) => {
  const { appMode } = useLab();
  const [imgStatus, setImgStatus] = useState('loading');
  const viewerRef = useRef(null);
  const viewerInstanceRef = useRef(null);

  useEffect(() => {
    if (appMode === 'fantasy') {
      setImgStatus('fantasy');
      return;
    }

    setImgStatus('loading');
    if (!viewerRef.current) return;

    viewerRef.current.innerHTML = '';

    viewerInstanceRef.current = $3Dmol.createViewer(viewerRef.current);
    viewerInstanceRef.current.setBackgroundColor(0x000000, 0);
    
    if (item.tier === 1 || item.has3D === false) {
      setImgStatus('error');
      return; 
    }

    const sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(item.name)}/SDF?record_type=3d`;

    fetch(sdfUrl)
      .then(res => {
        if (!res.ok) throw new Error('Molecule not found in 3D');
        return res.text();
      })
      .then(sdf => {
        viewerInstanceRef.current.addModel(sdf, "sdf");
        
        viewerInstanceRef.current.setStyle({}, { 
          stick: { radius: 0.15, colorscheme: 'Jmol' }, 
          sphere: { radius: 0.5, colorscheme: 'Jmol' } 
        }); 
        
        viewerInstanceRef.current.zoomTo(); 
        viewerInstanceRef.current.zoom(2.0); 
        viewerInstanceRef.current.render();
        
        setImgStatus('success');
      })
      .catch(() => {
        setImgStatus('error');
      });

      return () => {
        if (viewerInstanceRef.current) {
          viewerInstanceRef.current.clear();
        }
      };
  }, [item.name, item.tier, item.has3D, appMode]);

  const renderFantasyArt = () => (
    <div className="flex items-center justify-center h-full w-full relative overflow-hidden">
      {/* Outer magical ring */}
      <div 
        className="absolute w-40 h-40 border-4 border-dashed rounded-full animate-[spin_10s_linear_infinite] opacity-30" 
        style={{ borderColor: item.color || '#a855f7' }} 
      />
      {/* Inner magical ring */}
      <div 
        className="absolute w-28 h-28 border-2 border-dotted rounded-full animate-[spin_6s_linear_infinite_reverse] opacity-50" 
        style={{ borderColor: item.color || '#a855f7' }} 
      />
      {/* Ambient core glow */}
      <div 
        className="absolute w-20 h-20 rounded-full animate-pulse blur-2xl opacity-40" 
        style={{ backgroundColor: item.color || '#a855f7' }} 
      />
      {/* Pulsing Emoji */}
      <div 
        className="relative z-10 text-6xl animate-pulse" 
        style={{ filter: `drop-shadow(0 0 15px ${item.color || '#a855f7'})`, animationDuration: '7.5s' }}
      >
        {item.emoji || '✨'}
      </div>
    </div>
  );

  const renderFallback = () => {
    const isCompound = item.tier > 1 || (item.formula && item.formula.length > 2);
    
    return (
      <div className="flex items-center justify-center h-full w-full relative">
         {isCompound && (
            <div 
              className="w-16 h-16 rounded-full absolute -ml-20 z-0"
              style={{
                background: `radial-gradient(circle at 30% 30%, #ffffff 0%, #06b6d4 30%, #082f49 90%)`,
                boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.6), 5px 10px 15px rgba(0,0,0,0.4)'
              }}
            >
              <div className="absolute top-[12%] left-[15%] w-[30%] h-[30%] bg-white/40 rounded-full blur-[2px]" />
            </div>
         )}
         
         <div 
           className="w-28 h-28 rounded-full relative z-10 transition-colors duration-500"
           style={{
             background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${item.color || '#8b5cf6'} 30%, #000000 90%)`,
             boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.7), 10px 15px 20px rgba(0,0,0,0.5)'
           }}
         >
            <div className="absolute top-[12%] left-[15%] w-[35%] h-[35%] bg-white/40 rounded-full blur-[3px]" />
         </div>

         {/* NEW: Floating 3D Unavailable Badge */}
         <div className="absolute bottom-3 left-0 w-full flex justify-center z-20 pointer-events-none">
           <span className="bg-slate-900/80 border border-slate-700/60 text-slate-400 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest backdrop-blur-md shadow-sm flex items-center gap-1.5">
             <Info className="w-3 h-3 text-slate-500" />
             3D Structure Unavailable
           </span>
         </div>
      </div>
    );
  };

  return (
    <div className="w-full h-48 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
       
       {imgStatus === 'loading' && (
         <span className="text-slate-500 text-sm font-medium animate-pulse absolute z-0">
           Loading 3D Geometry...
         </span>
       )}
       
       <div 
         ref={viewerRef} 
         className={`w-full h-full absolute inset-0 z-10 cursor-grab active:cursor-grabbing ${imgStatus !== 'success' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
       />

       {imgStatus === 'fantasy' && renderFantasyArt()}
       {imgStatus === 'error' && renderFallback()}
       
    </div>
  );
};

export default MolecularViewer;