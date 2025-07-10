'use client';

import { useState, useEffect } from 'react';
import ContractsTable from '@/components/ContractsTable';
import SidePanel from '@/components/SidePanel';
import ContractDetails from '@/components/ContractDetails';
import AddContract from '@/components/AddContract';
import NoticeBanner from '@/components/NoticeBanner';
import { useAuthentication } from '@/context/AuthenticationProvider';
import { Contract } from '@/services/contractService';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ConnectWallet from '@/components/ConnectWallet';
import authRequiredImage from 'public/auth-required.svg';

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const panelWidth = '53%'; // Changed to 53% of screen width

  const { isAuthenticated } = useAuthentication();

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
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

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
        className={`transition-all duration-300 ease-in-out`}
        style={{ paddingRight: isPanelOpen ? panelWidth : '0' }}
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

      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className='bg-black border-gray-700 max-w-md'>
          <DialogTitle className='sr-only'>Authentication Required</DialogTitle>
          <div className='p-4'>
            <NoticeBanner
              image={authRequiredImage}
              title='Authentication Required'
              description='Please connect to your wallet and sign the transaction to add contracts.'
            />
            <div className='flex justify-center'>
              <div className='px-4 py-2 bg-black text-white border border-white rounded-md inline-flex items-center gap-2'>
                <ConnectWallet
                  customCallback={() => setIsAuthModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
