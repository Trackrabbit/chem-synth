// src/context/LabProvider.jsx
import React, { useState, useMemo } from 'react';
import { LabContext } from './LabContext';

export const LabProvider = ({ children }) => {
  // Application Mode
  const [appMode, setAppMode] = useState('chemistry');

  // Workbench Slots
  const [slot1, setSlot1] = useState(null);
  const [slot2, setSlot2] = useState(null);
  const [slot1Qty, setSlot1Qty] = useState(1);
  const [slot2Qty, setSlot2Qty] = useState(1);

  // Environmental Variables
  const [applyHeat, setApplyHeat] = useState(false);
  const [applyPressure, setApplyPressure] = useState(false);

  // Global UI States
  const [isMixing, setIsMixing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [datasheetItem, setDatasheetItem] = useState(null);

  // Tutor Chat History
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your ChemSynth tutor. Need help with a synthesis?' }
  ]);

  const addMessage = (role, content) => {
    setChatHistory(prev => [...prev, { role, content }]);
  };

  const clearChat = () => {
    setChatHistory([{ role: 'assistant', content: 'Hello! I am your ChemSynth tutor. Need help with a synthesis?' }]);
  };

  const clearBench = () => {
    setSlot1(null);
    setSlot2(null);
    setSlot1Qty(1);
    setSlot2Qty(1);
    setApplyHeat(false);
    setApplyPressure(false);
    setLastResult(null);
    setErrorMsg("");
  };

  const value = useMemo(() => ({
    appMode, setAppMode,
    slot1, setSlot1,
    slot2, setSlot2,
    slot1Qty, setSlot1Qty,
    slot2Qty, setSlot2Qty,
    applyHeat, setApplyHeat,
    applyPressure, setApplyPressure,
    isMixing, setIsMixing,
    lastResult, setLastResult,
    errorMsg, setErrorMsg,
    datasheetItem, setDatasheetItem,
    chatHistory, addMessage, clearChat,
    clearBench
  }), [
    appMode, slot1, slot2, slot1Qty, slot2Qty, 
    applyHeat, applyPressure, isMixing, lastResult, 
    errorMsg, datasheetItem, chatHistory
  ]);

  return (
    <LabContext.Provider value={value}>
      {children}
    </LabContext.Provider>
  );
};

export const useLab = () => {
  const context = React.useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
};