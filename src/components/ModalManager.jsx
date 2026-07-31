import React from 'react';
import { useLab } from '../context/LabProvider';
import ResetModal from './ResetModal';
import DiscoveryModal from './DiscoveryModal';
import RecipeLog from './RecipeLog';
import DuplicateModal from './DuplicateModal';
import DatasheetModal from './DatasheetModal';
import DiscoveryTree from './DiscoveryTree'; 

const ModalManager = ({
  appMode, inventory,
  showResetModal, setShowResetModal, handleReset, isResetting,
  showDiscovery, setShowDiscovery, discoveredElement,
  showRecipeLog, setShowRecipeLog,
  showDuplicateModal, setShowDuplicateModal, knownDuplicate, executeMix
}) => {
  
  const { datasheetItem, setDatasheetItem } = useLab();

  return (
    <>
      <ResetModal 
        show={showResetModal} onClose={() => setShowResetModal(false)} 
        onConfirm={handleReset} isResetting={isResetting} 
      />
      <DiscoveryModal 
        isVisible={showDiscovery} newElement={discoveredElement} 
        onClose={() => setShowDiscovery(false)} 
      />
      <RecipeLog 
        isVisible={showRecipeLog} inventory={inventory} 
        onClose={() => setShowRecipeLog(false)} 
      />
      <DuplicateModal 
        isOpen={showDuplicateModal} knownResult={knownDuplicate} 
        onCancel={() => setShowDuplicateModal(false)} onConfirm={() => executeMix(knownDuplicate)} 
      />
      <DatasheetModal 
        isOpen={!!datasheetItem} 
        item={datasheetItem} 
        onClose={() => setDatasheetItem(null)} 
        appMode={appMode}
      >
        {datasheetItem && (
          <div className="mt-8 border-t border-slate-800 pt-6">
            <DiscoveryTree 
              element={datasheetItem} 
              inventory={inventory} 
              onSelect={(item) => {
                if (item) setDatasheetItem(item);
              }}
            />
          </div>
        )}
      </DatasheetModal>
    </>
  );
};

export default ModalManager;