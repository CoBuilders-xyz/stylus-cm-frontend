'use client';

import React, { useState, useRef, useEffect } from 'react';
import { formatEther } from 'viem';
import { formatDate, formatRoundedEth } from '@/utils/formatting';
import { Contract, Alert } from '@/services/contractService';
import {
  MoreHorizontal,
  PlusCircle,
  ChevronLast,
  BellRing,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useSidePanel } from './SidePanel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useContractService } from '@/hooks/useContractService';
import { useContractsUpdater } from '@/hooks/useContractsUpdater';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import Image from 'next/image';
import noManagedImage from 'public/no-managed.svg';
import { ScrollArea } from '@/components/ui/scroll-area';
import BiddingHistory, { BiddingHistoryItem } from './BiddingHistory';
import ContractInfo from './ContractInfo';
import RemoveConfirmationModal from './RemoveConfirmationModal';
import EditableContractName, {
  EditableContractNameRef,
} from './EditableContractName';
import BidNowSection from './BidNowSection';
import AutomatedBiddingSection from './AutomatedBiddingSection';
import ContractStatus from './ContractStatus';
import { showSomethingWentWrongToast } from '@/components/Toast';
import { Badge } from '@/components/ui/badge';

// Auxiliary function to get explorer URL and enabled state
const getExplorerLinkInfo = (
  chainId: string | null,
  contractAddress: string
) => {
  let explorerUrl = '';
  let isEnabled = false;
  console.log('chainId', chainId);
  if (chainId === '42161') {
    explorerUrl = `https://arbiscan.io/address/${contractAddress}`;
    isEnabled = true;
  } else if (chainId === '421614') {
    explorerUrl = `https://sepolia.arbiscan.io/address/${contractAddress}`;
    isEnabled = true;
  }

  return { explorerUrl, isEnabled };
};

// Explorer Link Button Component
interface ExplorerLinkButtonProps {
  chainId: string | null;
  contractAddress: string;
}

const ExplorerLinkButton: React.FC<ExplorerLinkButtonProps> = ({
  chainId,
  contractAddress,
}) => {
  const { explorerUrl, isEnabled } = getExplorerLinkInfo(
    chainId,
    contractAddress
  );

  return (
    <button
      className={`${
        isEnabled
          ? 'hover:text-white cursor-pointer'
          : 'opacity-50 cursor-not-allowed'
      }`}
      onClick={() => {
        if (isEnabled) {
          window.open(explorerUrl, '_blank');
        }
      }}
      disabled={!isEnabled}
      title={
        isEnabled
          ? 'View on block explorer'
          : 'Explorer not available for this network'
      }
    >
      <ExternalLink className='h-4 w-4' />
    </button>
  );
};

interface ContractDetailsProps {
  contractId: string;
  initialContractData?: Contract;
  viewType?: 'explore-contracts' | 'my-contracts';
  onAddContract?: (contract: Contract) => void;
  onShowAlerts?: (
    userContractId: string,
    address: string,
    alerts?: Alert[]
  ) => void;
}

export default function ContractDetails({
  contractId,
  initialContractData,
  viewType = 'explore-contracts',
  onAddContract,
  onShowAlerts,
}: ContractDetailsProps) {
  // Get the onClose function from the SidePanel context
  const { onClose } = useSidePanel();

  // Get the contract service
  const contractService = useContractService();

  // Get the contracts updater
  const { signalContractUpdated } = useContractsUpdater();

  // Get the blockchain service
  const { currentBlockchainId, currentBlockchain } = useBlockchainService();

  // Reference to the EditableContractName component
  const contractNameRef = useRef<EditableContractNameRef>(null);

  // Store the user contract ID separately to avoid type issues
  const [userContractId, setUserContractId] = useState<string | null>(null);

  // State for bidding form (only used in my-contracts view)
  const [bidAmount, setBidAmount] = useState('');
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [automationFunding, setAutomationFunding] = useState('');

  // State for contract data and loading
  const [contractData, setContractData] = useState<Contract | null>(
    initialContractData || null
  );
  const [isLoadingContract, setIsLoadingContract] = useState(
    !initialContractData
  );

  // State for contract name
  const [contractName, setContractName] = useState(
    contractData?.name || 'Contract Name'
  );

  // Reset dialog state when component unmounts
  const [removeState, setRemoveState] = useState({
    isRemoving: false,
    showConfirmation: false,
  });

  // Initialize contract data from initialContractData whenever it changes
  useEffect(() => {
    if (initialContractData) {
      // Make sure to initialize alerts array if it's not present
      const contractWithAlerts = {
        ...initialContractData,
        // Ensure alerts exists, even if empty
        alerts: initialContractData.alerts || [],
      };
      setContractData(contractWithAlerts);
      setContractName(initialContractData.name || 'Contract Name');
      setIsLoadingContract(false);
    }
  }, [initialContractData]);

  // Fetch contract data from the backend
  useEffect(() => {
    async function fetchContractData() {
      if (!contractService || !contractId) return;

      try {
        setIsLoadingContract(true);
        // For my-contracts view, always fetch the full contract data from the backend
        if (viewType === 'my-contracts') {
          const userContract = await contractService.getUserContract(
            contractId
          );

          if (userContract && userContract.contract) {
            // Clone the contract object to avoid reference issues
            const contractWithAlerts = {
              userContractId: userContract.id,
              ...userContract.contract,
              // Use name from the top-level userContract, as that's the user-customized name
              name:
                userContract.name ||
                userContract.contract.name ||
                'Contract Name',
              // Use alerts from userContract if present, otherwise keep contract's alerts or set to empty array
              alerts: userContract.alerts || userContract.contract.alerts || [],
            };
            setContractData(contractWithAlerts);
            // Set the contract name from userContract.name, which is the user-customized name
            setContractName(
              userContract.name || userContract.contract.name || 'Contract Name'
            );
            // Store the userContract.id separately in state
            setUserContractId(userContract.id);
          }
        }
        // For explore-contracts view, we rely on initialContractData being provided
        // No need to fetch individually as we don't have a getExploreContract API endpoint
      } catch (error) {
        console.error('Failed to fetch contract data:', error);
      } finally {
        setIsLoadingContract(false);
      }
    }

    fetchContractData();
  }, [contractService, contractId, viewType, initialContractData]);

  // Transform bidding history data for display
  const processBiddingHistory = (): BiddingHistoryItem[] => {
    if (!contractData || !contractData.biddingHistory) return [];

    return contractData.biddingHistory.map((historyItem, index) => {
      // Use isAutomated directly from the API response
      const isAutomated = historyItem.isAutomated === true;

      // Format the address for display
      const displayAddress =
        historyItem.contractAddress.substring(0, 6) +
        '...' +
        historyItem.contractAddress.substring(
          historyItem.contractAddress.length - 4
        );

      const displayOriginAddress =
        historyItem.originAddress.substring(0, 6) +
        '...' +
        historyItem.originAddress.substring(
          historyItem.originAddress.length - 4
        );
      // Format the date using the formatDate utility for consistency
      const formattedDate = formatDate(historyItem.timestamp);

      // Format bid amount
      const bidAmount = formatRoundedEth(
        formatEther(BigInt(historyItem.actualBid))
      );

      return {
        id: index, // Using index as id since the API might not provide one
        address: displayAddress,
        bid: bidAmount,
        type: isAutomated ? 'automated bid' : 'manual bid',
        date: formattedDate,
        amount: bidAmount,
        transactionHash: historyItem.transactionHash,
        contractName: contractName,
        originAddress: displayOriginAddress,
        isAutomated: isAutomated, // Add the isAutomated field to match BiddingHistoryItem
      };
    });
  };

  // Get the processed bidding history
  const bidHistory = processBiddingHistory();

  // Use the actual bidding history without creating fallback placeholders
  const displayBidHistory: BiddingHistoryItem[] = bidHistory;

  // If we're still loading and don't have contract data, show a loading state
  if (isLoadingContract && !contractData) {
    return (
      <div className='text-white flex flex-col h-full bg-[#1A1919] items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white'></div>
        <p className='mt-4'>Loading contract details...</p>
      </div>
    );
  }

  // If we failed to load contract data, show an error
  if (!contractData) {
    return (
      <div className='text-white flex flex-col h-full bg-[#1A1919] items-center justify-center p-6'>
        <div className='text-red-500 text-6xl mb-4'>!</div>
        <h3 className='text-xl font-bold mb-2'>Contract Not Found</h3>
        <p className='text-gray-400 text-center mb-6'>
          We couldn&apos;t find details for this contract. It may have been
          removed or there was an error.
        </p>
        <Button
          onClick={onClose}
          className='px-4 py-2 bg-black text-white border border-white rounded-md'
        >
          Close
        </Button>
      </div>
    );
  }

  // Handler for adding contract to my contracts
  const handleAddToMyContracts = async () => {
    if (!contractService || !contractData) {
      console.error('Contract service or data not available');
      return;
    }

    // Verify we have a valid blockchain ID
    if (!currentBlockchainId) {
      console.error('No valid blockchain ID available');
      return;
    }

    try {
      // Create a properly typed name variable
      const name: string | undefined =
        typeof contractName === 'string' && contractName !== 'Contract Name'
          ? contractName
          : undefined;

      // Use the actual contract address from the current contract data
      const result = await contractService.createContract(
        contractData.address,
        currentBlockchainId, // This is string | null, but createContract expects string | undefined
        name
      );

      // Signal that a contract was added to trigger a reload of the my-contracts list
      signalContractUpdated(result.id, 'name');

      // Close the panel with a small delay to ensure visual feedback
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Failed to add contract:', error);
      // You could add error handling UI here
    }
  };

  // Handler for contract alerts
  const handleContractAlerts = () => {
    if (onShowAlerts && userContractId && contractData) {
      onShowAlerts(userContractId, contractData.address, contractData.alerts);
    }
  };

  const handleRenameContract = () => {
    // Trigger edit mode in the EditableContractName component
    if (contractNameRef.current) {
      contractNameRef.current.setEditing(true);
    }
  };

  // Handle confirming contract removal
  const confirmRemoveContract = async () => {
    if (!contractService) {
      console.error('Contract service not available');
      return;
    }

    try {
      // Set loading state
      setRemoveState((prev) => ({ ...prev, isRemoving: true }));

      // The deleteUserContract method returns a Promise that resolves when successful (even with 204)
      // Use the stored userContractId if available, otherwise fall back to the main contractId
      const idToDelete = userContractId || contractId;
      await contractService.deleteUserContract(idToDelete);

      // Signal that the contract was deleted to trigger a reload of the contracts list
      signalContractUpdated(idToDelete, 'deleted');

      // Reset states before closing panel
      setRemoveState({ isRemoving: false, showConfirmation: false });

      // Close the side panel after a small delay to ensure state updates are processed
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Failed to remove contract:', error);
      // Reset state on error
      setRemoveState({ isRemoving: false, showConfirmation: false });
    }
  };

  const handleRemoveContract = () => {
    // Show confirmation dialog
    setRemoveState((prev) => ({ ...prev, showConfirmation: true }));
  };

  const cancelRemoveContract = () => {
    setRemoveState({ isRemoving: false, showConfirmation: false });
  };

  const handleManageContract = () => {
    // If we have the onAddContract prop, use it (this allows the parent to control the flow)
    if (onAddContract && contractData) {
      onAddContract(contractData);
    } else {
      // Otherwise, fall back to the direct API call
      handleAddToMyContracts();
    }
  };

  // Handler for name change
  const handleNameChange = (newName: string) => {
    // Update the contract data with the new name
    if (contractData) {
      setContractData({
        ...contractData,
        name: newName,
      });
    }
    // Also update the name in the state for UI display
    setContractName(newName);
  };

  // Function to reload contract data after successful operations
  const reloadContractData = () => {
    // Reload contract data after successful operation
    if (viewType === 'my-contracts' && contractService && userContractId) {
      contractService
        .getUserContract(userContractId)
        .then((userContract) => {
          if (userContract && userContract.contract) {
            // Clone the contract object to avoid reference issues
            const contractWithAlerts = {
              ...userContract.contract,
              name:
                userContract.name ||
                userContract.contract.name ||
                'Contract Name',
              alerts: userContract.alerts || userContract.contract.alerts || [],
            };
            setContractData(contractWithAlerts);
          }
        })
        .catch((error) => {
          console.error('Failed to reload contract data:', error);
          showSomethingWentWrongToast();
        });
    }
  };

  return (
    <div className='text-white flex flex-col h-full bg-[#1A1919]'>
      {/* Main content with ScrollArea */}

      <ScrollArea className='flex-1'>
        <div className='p-6'>
          {/* Top Section: Contract Address and Name with Options */}
          <div className='flex justify-between items-center mb-6'>
            <div>
              {viewType === 'my-contracts' ? (
                <>
                  <div className='text-sm font-mono text-gray-300 flex items-center gap-2'>
                    {contractData.address}
                    <ExplorerLinkButton
                      chainId={currentBlockchain?.chainId.toString() || null}
                      contractAddress={contractData.address}
                    />
                  </div>
                  <EditableContractName
                    name={contractName}
                    contractId={userContractId || contractId}
                    onNameChange={handleNameChange}
                    ref={contractNameRef}
                  />
                </>
              ) : contractData.isSavedByUser ? (
                <>
                  <div className='text-sm font-mono text-gray-300'>
                    {contractData.address}
                  </div>
                  <div className='text-2xl font-bold bg-transparent outline-none border-0 w-full'>
                    {contractData.savedContractName}
                  </div>
                </>
              ) : (
                <div className='text-2xl font-mono mb-1'>
                  {contractData.address}
                </div>
              )}
            </div>
            <div className='flex gap-2'>
              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className='p-2 rounded-md border border-white hover:bg-gray-900'>
                    <MoreHorizontal className='h-5 w-5' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='bg-[#1E1E1E] border border-[#2C2E30] text-white'>
                  {viewType === 'my-contracts' ? (
                    <>
                      <DropdownMenuItem
                        className='hover:bg-gray-800 cursor-pointer'
                        onClick={handleContractAlerts}
                      >
                        <BellRing className='h-4 w-4 mr-2' />
                        Contract Alerts
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className='hover:bg-gray-800 cursor-pointer'
                        onClick={handleRenameContract}
                      >
                        <Edit2 className='h-4 w-4 mr-2' />
                        Rename Contract
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className='bg-[#2C2E30]' />
                      <DropdownMenuItem
                        className='hover:bg-gray-800 cursor-pointer text-red-500'
                        onClick={handleRemoveContract}
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Remove Contract
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      className={`${
                        !contractData.isSavedByUser
                          ? 'hover:bg-gray-800 cursor-pointer'
                          : 'cursor-not-allowed opacity-50'
                      }`}
                      onClick={
                        !contractData.isSavedByUser
                          ? handleManageContract
                          : undefined
                      }
                    >
                      <PlusCircle className='h-4 w-4 mr-2' />
                      {contractData.isSavedByUser
                        ? 'Contract Already Added'
                        : 'Manage This Contract'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                className='rounded-md border border-white hover:bg-gray-900'
                onClick={onClose}
              >
                <ChevronLast className='h-5 w-5' />
              </Button>
            </div>
          </div>
          {/* Rest of component remains mostly the same except uses contractData directly */}
          {viewType === 'my-contracts' ? (
            <>
              {/* Main statistics in a 2-column grid layout */}
              <ContractStatus
                isLoading={isLoadingContract}
                isCached={contractData?.bytecode.isCached}
                bidBlockTimestamp={contractData?.bidBlockTimestamp}
                effectiveBid={contractData?.effectiveBid}
                lastBid={contractData?.lastBid}
                viewType='my-contracts'
              />

              {/* Replace the flex items with the ContractDetailsTable */}
              <ContractInfo
                contractData={contractData}
                onManageAlerts={handleContractAlerts}
                isLoading={isLoadingContract}
                viewType='my-contracts'
              />

              {/* Bidding Section Header */}
              <div className='mb-3'>
                <h3 className='text-lg'>Bidding</h3>
              </div>

              {/* Bidding Section */}
              <div className='space-y-4 mb-8'>
                {/* Bid now section */}
                <BidNowSection
                  contract={contractData}
                  bidAmount={bidAmount}
                  setBidAmount={setBidAmount}
                  onSuccess={reloadContractData}
                />

                {/* Automated Bidding section */}
                <AutomatedBiddingSection
                  maxBidAmount={maxBidAmount}
                  setMaxBidAmount={setMaxBidAmount}
                  automationFunding={automationFunding}
                  setAutomationFunding={setAutomationFunding}
                  contract={contractData}
                  onSuccess={reloadContractData}
                />
              </div>

              {/* Use the BiddingHistory component */}
              <BiddingHistory
                isLoading={isLoadingContract}
                biddingHistory={displayBidHistory}
              />
            </>
          ) : (
            /* Explore Contracts View */
            <>
              {/* Main statistics in a 2-column grid layout */}
              <ContractStatus
                isLoading={isLoadingContract}
                isCached={contractData?.bytecode.isCached}
                bidBlockTimestamp={contractData?.bidBlockTimestamp}
                effectiveBid={contractData?.effectiveBid}
                lastBid={contractData?.lastBid}
                viewType='explore-contracts'
              />

              {/* Replace the flex items with the ContractDetailsTable */}
              <ContractInfo
                contractData={contractData}
                onManageAlerts={handleContractAlerts}
                isLoading={isLoadingContract}
                viewType='explore-contracts'
              />

              {/* Add to My Contracts Section */}
              <div className='px-6 text-center'>
                {!contractData.isSavedByUser ? (
                  <>
                    <div className='flex justify-center'>
                      <Image
                        src={noManagedImage}
                        alt='Add contract'
                        width={200}
                        height={200}
                      />
                    </div>
                    <h3 className='text-xl font-bold mb-2'>
                      Add this contract to place bids
                    </h3>
                    <p className='text-gray-400 text-sm mb-4'>
                      Add this contract to your managed list to place bids, set
                      automations and more.
                    </p>
                    <Button
                      className='px-4 py-2 bg-black text-white border border-[#2C2E30] hover:bg-gray-900 rounded-md'
                      onClick={handleManageContract}
                    >
                      Add to My Contracts
                    </Button>
                  </>
                ) : (
                  <>
                    <div className='flex justify-center'>
                      <Badge
                        variant='secondary'
                        className='px-4 py-2 text-base font-semibold'
                      >
                        Contract already added to your list
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Confirmation Dialog */}
      {removeState.showConfirmation && (
        <RemoveConfirmationModal
          isRemoving={removeState.isRemoving}
          onCancel={cancelRemoveContract}
          onConfirm={confirmRemoveContract}
        />
      )}
    </div>
  );
}
