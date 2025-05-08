'use client';

import { useState } from 'react';
import ContractsTable from '@/components/ContractsTable';
import SidePanel from '@/components/SidePanel';
import ContractDetails from '@/components/ContractDetails';
import AddContract from '@/components/AddContract';
import { Contract } from '@/services/contractService';

export default function MyContractsPage() {
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
  const panelWidth = '53%';

  const handleContractSelect = (contractId: string, initialData?: Contract) => {
    setSelectedContractId(contractId);
    setSelectedContractData(initialData || null);
    setActivePanelContent('details');
    setIsPanelOpen(true);
  };

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
            viewType='my-contracts'
            onContractSelect={handleContractSelect}
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
              viewType='my-contracts'
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
