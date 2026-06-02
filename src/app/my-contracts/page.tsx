'use client';

import { useState } from 'react';
import ContractsTable from '@/components/ContractsTable';
import SidePanel from '@/components/SidePanel';
import ContractDetails from '@/components/ContractDetails';
import AddContract from '@/components/AddContract';
import AlertsSettings from '@/components/AlertsSettings';
import { Contract, Alert } from '@/services/contractService';
import { Alert as AlertServiceAlert } from '@/services/alertService';
import { useContractService } from '@/hooks/useContractService';
import { useMediaQuery } from '@/hooks/use-media-query';

export default function MyContractsPage() {
  const contractService = useContractService();
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

  // State for alerts panel
  const [isAlertsPanelOpen, setIsAlertsPanelOpen] = useState(false);
  const [alertsContractId, setAlertsContractId] = useState<string>('');
  const [alertsContractAddress, setAlertsContractAddress] =
    useState<string>('');
  const [alertsContractAlerts, setAlertsContractAlerts] = useState<
    AlertServiceAlert[]
  >([]);

  const isDesktop = useMediaQuery('(min-width: 768px)');
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

  const handleCloseAlertsPanel = () => {
    setIsAlertsPanelOpen(false);
  };

  // Handler for opening alerts panel
  const handleShowAlerts = (
    userContractId: string,
    address: string,
    alerts?: Alert[]
  ) => {
    setAlertsContractId(userContractId);
    setAlertsContractAddress(address);
    // Convert contractService Alert[] to alertService Alert[] by adding userContractId
    const formattedAlerts = (alerts || []).map((alert) => ({
      ...alert,
      userContractId, // Add the required userContractId property
    })) as AlertServiceAlert[];
    setAlertsContractAlerts(formattedAlerts);
    setIsAlertsPanelOpen(true);
  };

  // Handler for alert settings success
  const handleAlertsSuccess = () => {
    // Reload contract data if needed
    if (contractService && selectedContractId) {
      contractService
        .getUserContract(selectedContractId)
        .then((userContract) => {
          if (userContract && userContract.contract) {
            // Clone and update contract data
            const updatedContract = {
              ...userContract.contract,
              userContractId: userContract.id,
              name:
                userContract.name ||
                userContract.contract.name ||
                'Contract Name',
              alerts: userContract.alerts || userContract.contract.alerts || [],
            };
            setSelectedContractData(updatedContract);
          }
        })
        .catch((error) => {
          console.error(
            'Failed to reload contract data after alert update:',
            error
          );
        });
    }
    setIsAlertsPanelOpen(false);
  };

  return (
    <div
      className='flex flex-col'
      style={{
        height: 'calc(100dvh - var(--app-chrome-h, 96px))',
        paddingTop: 'var(--app-chrome-h, 96px)',
      }}
    >
      <div
        className={`transition-all duration-300 ease-in-out flex-1 flex flex-col overflow-hidden`}
        style={{
          paddingRight: isDesktop && isPanelOpen ? panelWidth : '0',
        }}
      >
        <div className='p-4 sm:p-6 md:p-10 flex-1 flex flex-col overflow-hidden'>
          <ContractsTable
            contracts={[]}
            viewType='my-contracts'
            onContractSelect={handleContractSelect}
            onAddNewContract={handleAddNewContract}
          />
        </div>
      </div>

      {/* Main Side Panel (Contract Details or Add Contract) */}
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
              onShowAlerts={handleShowAlerts}
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

      {/* Alerts Settings Side Panel */}
      <SidePanel
        isOpen={isAlertsPanelOpen}
        onClose={handleCloseAlertsPanel}
        width={panelWidth}
        zIndex={50}
      >
        {isAlertsPanelOpen && (
          <AlertsSettings
            contractId={alertsContractId}
            contractAddress={alertsContractAddress}
            initialAlerts={alertsContractAlerts}
            onSuccess={handleAlertsSuccess}
          />
        )}
      </SidePanel>
    </div>
  );
}
