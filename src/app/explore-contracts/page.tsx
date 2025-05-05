'use client';

import { useState, useEffect } from 'react';
import ContractsTable from '@/components/ContractsTable';
import SidePanel from '@/components/SidePanel';
import ContractDetails from '@/components/ContractDetails';
import { Contract } from '@/services/contractService';

export default function ExploreContractsPage() {
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null
  );
  const [selectedContractData, setSelectedContractData] =
    useState<Contract | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelWidth = '53%'; // Changed to 53% of screen width

  // Set CSS variable for header height
  useEffect(() => {
    const setHeaderHeight = () => {
      const header = document.querySelector(
        'div[class*="bg-black text-white z-10 flex"]'
      );
      if (header) {
        document.documentElement.style.setProperty(
          '--header-height',
          `${header.clientHeight}px`
        );
      }
    };

    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);

    return () => {
      window.removeEventListener('resize', setHeaderHeight);
    };
  }, []);

  // New handler with contractId and initial data
  const handleContractSelect = (contractId: string, initialData?: Contract) => {
    setSelectedContractId(contractId);
    setSelectedContractData(initialData || null);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <div className='min-h-screen pt-18'>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isPanelOpen ? 'pr-[53%]' : 'pr-0'
        }`}
      >
        <div className='p-10'>
          <ContractsTable
            contracts={[]}
            viewType='explore-contracts'
            onContractSelect={handleContractSelect}
          />
        </div>
      </div>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        width={panelWidth}
      >
        {selectedContractId && (
          <ContractDetails
            contractId={selectedContractId}
            initialContractData={selectedContractData || undefined}
            viewType='explore-contracts'
          />
        )}
      </SidePanel>
    </div>
  );
}
