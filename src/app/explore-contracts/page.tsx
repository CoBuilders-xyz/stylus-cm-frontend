'use client';

import { useState, useEffect } from 'react';
import ContractsTable from '@/components/ContractsTable';
import SidePanel from '@/components/SidePanel';
import ContractDetails from '@/components/ContractDetails';
import AddContract from '@/components/AddContract';
import { Contract } from '@/services/contractService';

export default function ExploreContractsPage() {
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null
  );
  const [selectedContractData, setSelectedContractData] =
    useState<Contract | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activePanelContent, setActivePanelContent] = useState<
    'details' | 'add'
  >('details');
  const [contractAddressToAdd, setContractAddressToAdd] = useState<
    string | undefined
  >(undefined);
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

  // Handler for contract selection (view details)
  const handleContractSelect = (contractId: string, initialData?: Contract) => {
    setSelectedContractId(contractId);
    setSelectedContractData(initialData || null);
    setActivePanelContent('details');
    setIsPanelOpen(true);
  };

  // Handler for adding an existing contract (from table row or details)
  const handleAddExistingContract = (contract: Contract) => {
    setContractAddressToAdd(contract.address);
    setActivePanelContent('add');
    setIsPanelOpen(true);
  };

  // Handler for adding a new contract
  const handleAddNewContract = () => {
    setContractAddressToAdd(undefined);
    setActivePanelContent('add');
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
            onAddContract={handleAddExistingContract}
            onAddNewContract={handleAddNewContract}
          />
        </div>
      </div>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        width={panelWidth}
      >
        {isPanelOpen &&
          activePanelContent === 'details' &&
          selectedContractId && (
            <ContractDetails
              contractId={selectedContractId}
              initialContractData={selectedContractData || undefined}
              viewType='explore-contracts'
              onAddContract={handleAddExistingContract}
            />
          )}
        {isPanelOpen && activePanelContent === 'add' && (
          <AddContract
            initialAddress={contractAddressToAdd}
            onSuccess={() => {
              setIsPanelOpen(false);
            }}
          />
        )}
      </SidePanel>
    </div>
  );
}
