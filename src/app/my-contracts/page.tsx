'use client';

import { useState } from 'react';
import ContractsTable from '@/components/ContractsTable';
import SidePanel from '@/components/SidePanel';
import ContractDetails from '@/components/ContractDetails';
import { Contract } from '@/services/contractService';

export default function MyContractsPage() {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelWidth = '53%';

  const handleContractClick = (contract: Contract) => {
    setSelectedContract(contract);
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <div className='min-h-screen  pt-18'>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isPanelOpen ? 'pr-[53%]' : 'pr-0'
        }`}
      >
        <div className='p-10'>
          <ContractsTable
            contracts={[]}
            viewType='my-contracts'
            onRowClick={handleContractClick}
          />
        </div>
      </div>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        width={panelWidth}
      >
        {selectedContract && (
          <ContractDetails
            contract={selectedContract}
            viewType='my-contracts'
          />
        )}
      </SidePanel>
    </div>
  );
}
