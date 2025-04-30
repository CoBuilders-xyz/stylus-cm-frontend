'use client';

import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import { Contract } from '@/services/contractService';
import { formatEth, formatDate } from '@/utils/formatting';
import {
  MoreHorizontal,
  PlusCircle,
  ChevronLast,
  BellRing,
  Edit2,
  Trash2,
  Pencil,
  Check,
  X,
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
import Image from 'next/image';
import noManagedImage from 'public/no-managed.svg';
import { ScrollArea } from '@/components/ui/scroll-area';
import BiddingHistory, { BiddingHistoryItem } from './BiddingHistory';
import ContractInfo from './ContractInfo';
import RemoveConfirmationModal from './RemoveConfirmationModal';

interface ContractDetailsProps {
  contractId: string;
  initialContractData?: Contract;
  viewType?: 'explore-contracts' | 'my-contracts';
}

// EditableContractName component
interface EditableContractNameProps {
  name: string;
  contractId: string;
  onNameChange: (newName: string) => void;
}

function EditableContractName(
  { name, contractId, onNameChange }: EditableContractNameProps,
  ref: React.ForwardedRef<{ setEditing: (isEditing: boolean) => void }>
) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPencil, setShowPencil] = useState(false);
  const [inputValue, setInputValue] = useState(name || 'Contract Name');
  const [isLoading, setIsLoading] = useState(false);
  const contractService = useContractService();
  const { signalContractUpdated } = useContractsUpdater();

  // Update input value when name prop changes
  useEffect(() => {
    setInputValue(name || 'Contract Name');
  }, [name]);

  // Expose the setIsEditing function via ref
  useImperativeHandle(ref, () => ({
    setEditing: (value: boolean) => {
      setIsEditing(value);
    },
  }));

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!inputValue.trim()) {
      setInputValue(name || 'Contract Name');
      setIsEditing(false);
      return;
    }

    if (contractService && contractId) {
      try {
        setIsLoading(true);
        await contractService.updateUserContractName(contractId, inputValue);
        onNameChange(inputValue);

        // Signal that a contract has been updated to trigger a reload
        signalContractUpdated(contractId, 'name');
      } catch (error) {
        console.error('Failed to update contract name:', error);
        // Revert to original name on error
        setInputValue(name || 'Contract Name');
      } finally {
        setIsLoading(false);
        setIsEditing(false);
      }
    } else {
      // Fallback if no service available
      onNameChange(inputValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputValue(name || 'Contract Name');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div
      className='relative group'
      onMouseEnter={() => setShowPencil(true)}
      onMouseLeave={() => setShowPencil(false)}
    >
      {isEditing ? (
        <div className='flex items-center'>
          <input
            type='text'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className='text-2xl font-bold bg-transparent outline-none border-0 border-b-2 border-[#3E71C6] w-full'
            placeholder={name || 'Contract Name'}
            style={{ backgroundColor: '#494949' }}
            autoFocus
            disabled={isLoading}
          />
          <div className='flex ml-2'>
            <Button
              onClick={handleSave}
              className='text-white hover:text-green-400 bg-transparent p-0 h-auto'
              disabled={isLoading}
            >
              <Check className='h-5 w-5' />
            </Button>
            <Button
              onClick={handleCancel}
              className='text-white hover:text-red-400 bg-transparent p-0 h-auto ml-1'
              disabled={isLoading}
            >
              <X className='h-5 w-5' />
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex items-center'>
          <div className='text-2xl font-bold mb-1'>
            {name || 'Contract Name'}
          </div>
          {showPencil && !isEditing && (
            <Button
              onClick={handleEditClick}
              className='opacity-0 group-hover:opacity-100 transition-opacity bg-transparent p-0 h-auto ml-2'
            >
              <Pencil className='h-3 w-3 text-gray-400 hover:text-white' />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Use forwardRef to be able to pass refs to the component
const ForwardedEditableContractName = forwardRef<
  { setEditing: (isEditing: boolean) => void },
  EditableContractNameProps
>(EditableContractName);

export default function ContractDetails({
  contractId,
  initialContractData,
  viewType = 'explore-contracts',
}: ContractDetailsProps) {
  // Get the onClose function from the SidePanel context
  const { onClose } = useSidePanel();

  // Get the contract service
  const contractService = useContractService();

  // Get the contracts updater
  const { signalContractUpdated } = useContractsUpdater();

  // Reference to the EditableContractName component
  const contractNameRef = useRef<{
    setEditing: (isEditing: boolean) => void;
  }>(null);

  // Store the user contract ID separately to avoid type issues
  const [userContractId, setUserContractId] = useState<string | null>(null);

  // State for bidding form (only used in my-contracts view)
  const [bidAmount, setBidAmount] = useState('');
  const [automatedBidding, setAutomatedBidding] = useState(false);

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

  // Minimum bid based on contract data or calculation
  const minBidAmount = contractData
    ? formatEth(contractData.minBid || contractData.lastBid)
    : '0';

  // Transform bidding history data for display
  const processBiddingHistory = (): BiddingHistoryItem[] => {
    if (!contractData || !contractData.biddingHistory) return [];

    return contractData.biddingHistory.map((historyItem, index) => {
      // Determine if it's an automatic or manual bid
      const isAutomaticBid =
        historyItem.contractAddress.toLowerCase() ===
        contractData.blockchain.cacheManagerAutomationAddress.toLowerCase();

      // Format the address for display
      const displayAddress =
        historyItem.contractAddress.substring(0, 6) +
        '...' +
        historyItem.contractAddress.substring(
          historyItem.contractAddress.length - 4
        );

      // Format the date using the formatDate utility for consistency
      const formattedDate = formatDate(historyItem.timestamp);

      // Format bid amount
      const bidAmount = formatEth(historyItem.actualBid).split(' ')[0];

      return {
        id: index, // Using index as id since the API might not provide one
        address: displayAddress,
        bid: bidAmount,
        type: isAutomaticBid ? 'automatic bid' : 'manual bid',
        date: formattedDate,
        amount: bidAmount,
        transactionHash: historyItem.transactionHash,
        contractName: contractName,
      };
    });
  };

  // Get the processed bidding history
  const bidHistory = processBiddingHistory();

  // If there's no bidding history and not loading, create a fallback placeholder
  const displayBidHistory =
    bidHistory.length > 0
      ? bidHistory
      : contractData && !isLoadingContract
      ? [
          // Fallback to a placeholder if no history available
          {
            id: 0,
            address:
              contractData.blockchain.cacheManagerAddress.substring(0, 6) +
              '...' +
              contractData.blockchain.cacheManagerAddress.substring(
                contractData.blockchain.cacheManagerAddress.length - 4
              ),
            bid: formatEth(contractData.lastBid).split(' ')[0],
            type: 'automatic bid',
            date: formatDate(contractData.bidBlockTimestamp),
            amount: formatEth(contractData.lastBid).split(' ')[0],
            contractName: contractName,
          },
        ]
      : [];

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

  // Handler for bid submission
  const handleSubmitBid = () => {
    // Here would be API call to submit bid
  };

  // Handler for adding contract to my contracts
  const handleAddToMyContracts = () => {
    // Here would be API call to add contract
  };

  // Handler for contract alerts
  const handleContractAlerts = () => {
    // Here would be the implementation to manage alerts
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
    // Here would be the implementation to add and manage this contract
    handleAddToMyContracts();
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
                  <div className='text-sm font-mono text-gray-300'>
                    {contractData.address}
                  </div>
                  <ForwardedEditableContractName
                    name={contractName}
                    contractId={userContractId || contractId}
                    onNameChange={handleNameChange}
                    ref={contractNameRef}
                  />
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
                      className='hover:bg-gray-800 cursor-pointer'
                      onClick={handleManageContract}
                    >
                      <PlusCircle className='h-4 w-4 mr-2' />
                      Manage This Contract
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
              <div className='grid grid-cols-2 gap-4 mb-6'>
                {/* Cache Status */}
                <div className='border border-[#2C2E30] rounded-md p-4'>
                  <div className='text-gray-400 text-sm'>Cache Status</div>
                  <div className='text-xl font-bold'>
                    {contractData.bytecode.isCached ? 'Cached' : 'Not Cached'}
                  </div>
                  <div className='text-xs text-gray-400'>
                    Last Cached {formatDate(contractData.bidBlockTimestamp)}
                  </div>
                </div>

                {/* Effective Bid */}
                <div className='border border-[#2C2E30] rounded-md p-4'>
                  <div className='text-gray-400 text-sm'>Effective Bid</div>
                  <div className='text-xl font-bold'>
                    {formatEth(contractData.effectiveBid || '')}
                  </div>
                  <div className='text-xs text-gray-400'>
                    Bid: {formatEth(contractData.lastBid)}
                  </div>
                </div>
              </div>

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
                <div
                  className='relative rounded-md p-4 overflow-hidden'
                  style={{
                    background:
                      'linear-gradient(89.49deg, #3E71C6 0%, #5897B2 55.53%, #C35B88 103.8%)',
                  }}
                >
                  {/* White noise texture overlay */}
                  <div
                    className='absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none'
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='white'/%3E%3C/svg%3E")`,
                      backgroundSize: '100px 100px',
                      backgroundRepeat: 'repeat',
                    }}
                  />

                  <div className='flex justify-between items-start relative z-10'>
                    <div>
                      <p className='font-bold'>Bid now</p>
                      <p className='text-sm text-blue-200'>
                        Higher bids extend cache duration
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='relative rounded-md overflow-hidden'>
                        <input
                          type='text'
                          placeholder={`From ${minBidAmount}`}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className='px-3 py-2 bg-[#40507A] border-none outline-none text-white w-50'
                        />
                      </div>
                      <Button
                        className='px-4 py-2 bg-black text-white border-none rounded-md'
                        onClick={handleSubmitBid}
                      >
                        Place bid
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Automated Bidding section */}
                <div
                  className='relative rounded-md p-4 overflow-hidden'
                  style={{
                    background:
                      'linear-gradient(89.49deg, #3E71C6 0%, #5897B2 103.8%)',
                  }}
                >
                  {/* White noise texture overlay */}
                  <div
                    className='absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none'
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='white'/%3E%3C/svg%3E")`,
                      backgroundSize: '100px 100px',
                      backgroundRepeat: 'repeat',
                    }}
                  />

                  <div className='flex justify-between items-center relative z-10'>
                    <div>
                      <p className='font-bold'>Enable Automated Bidding</p>
                      <p className='text-sm text-blue-200'>
                        Set a maximum bid value to maintain your position in the
                        cache without manual intervention
                      </p>
                    </div>
                    <div className='relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 data-[state=checked]:bg-[#9747FF]'>
                      <span
                        className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          automatedBidding ? 'translate-x-5' : 'translate-x-0'
                        }`}
                        onClick={() => setAutomatedBidding(!automatedBidding)}
                      ></span>
                    </div>
                  </div>
                </div>
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
              <div className='grid grid-cols-2 gap-4 mb-6'>
                {/* Cache Status */}
                <div className='border border-[#2C2E30] rounded-md p-4'>
                  <div className='text-gray-400 text-sm'>Cache Status</div>
                  <div className='text-xl font-bold'>
                    {contractData.bytecode.isCached ? 'Cached' : 'Not Cached'}
                  </div>
                  <div className='text-xs text-gray-400'>
                    Last Cached {formatDate(contractData.bidBlockTimestamp)}
                  </div>
                </div>

                {/* Effective Bid */}
                <div className='border border-[#2C2E30] rounded-md p-4'>
                  <div className='text-gray-400 text-sm'>Effective Bid</div>
                  <div className='text-xl font-bold'>
                    {formatEth(contractData.effectiveBid || '0.03')}
                  </div>
                  <div className='text-xs text-gray-400'>
                    Bid: {formatEth(contractData.lastBid)}
                  </div>
                </div>
              </div>

              {/* Replace the flex items with the ContractDetailsTable */}
              <ContractInfo
                contractData={contractData}
                onManageAlerts={handleContractAlerts}
                isLoading={isLoadingContract}
                viewType='explore-contracts'
              />

              {/* Add to My Contracts Section */}
              <div className='px-6 text-center'>
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
                  onClick={handleAddToMyContracts}
                >
                  Add to My Contracts
                </Button>
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
