'use client';

import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import { Contract, Alert } from '@/services/contractService';
import {
  formatEth,
  formatSize,
  formatDate,
  formatRiskLevel,
  getRiskBadgeVariant,
} from '@/utils/formatting';
import {
  MoreHorizontal,
  Edit,
  PlusCircle,
  ChevronLast,
  BellRing,
  Edit2,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
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
import removeContractImage from 'public/remove-contract.svg';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ContractDetailsProps {
  contract: Contract;
  viewType?: 'explore-contracts' | 'my-contracts';
}

// EditableContractName component
interface EditableContractNameProps {
  name: string;
  contractId: string;
  onNameChange: (newName: string) => void;
}

// Bidding history item interface
interface BiddingHistoryItem {
  id: number;
  address: string;
  bid: string;
  type: string;
  date: string;
  amount: string;
  transactionHash?: string;
  contractName: string;
}

// Alert component that handles alert display
function ContractAlerts({
  alerts,
  onManageAlerts,
}: {
  alerts?: Alert[];
  onManageAlerts: () => void;
}) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className='flex justify-between items-center'>
        <div className='text-gray-400'>Active alerts</div>
        <Button
          onClick={onManageAlerts}
          className='px-3 py-1 border border-dashed border-gray-600 text-gray-400 bg-transparent hover:bg-gray-800 rounded-md text-xs flex items-center gap-1'
        >
          <PlusCircle className='h-3 w-3' />
          Add alerts
        </Button>
      </div>
    );
  }

  // Helper to get the right background color for each alert type
  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'eviction':
        return 'bg-red-900/50';
      case 'noGas':
        return 'bg-yellow-900/50';
      case 'lowGas':
        return 'bg-blue-900/50';
      case 'bidSafety':
        return 'bg-green-900/50';
      default:
        return 'bg-gray-900/50';
    }
  };

  // Helper to format alert display text
  const getAlertText = (alert: Alert) => {
    switch (alert.type) {
      case 'eviction':
        return 'Eviction';
      case 'noGas':
        return 'No gas';
      case 'lowGas':
        return `Low gas:${alert.value} ETH`;
      case 'bidSafety':
        return `Bid Safety:${alert.value}%`;
      default:
        return alert.type;
    }
  };

  return (
    <div className='flex justify-between items-center'>
      <div className='text-gray-400'>Active alerts</div>
      <div className='flex gap-2 items-center'>
        {alerts
          .filter((alert) => alert.isActive)
          .map((alert) => (
            <span
              key={alert.id}
              className={`px-3 py-1 ${getAlertStyle(
                alert.type
              )} text-white text-xs rounded-full`}
            >
              {getAlertText(alert)}
            </span>
          ))}
        <Button
          className='p-1 rounded-md bg-transparent border border-gray-700 hover:bg-gray-900'
          onClick={onManageAlerts}
        >
          <Edit className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

// BiddingHistory component
function BiddingHistory({
  isLoading,
  biddingHistory,
}: {
  isLoading: boolean;
  biddingHistory: BiddingHistoryItem[];
}) {
  // State to track how many entries to show
  const [visibleEntries, setVisibleEntries] = useState(3);

  // Handler for loading more entries
  const handleLoadMore = () => {
    setVisibleEntries((prev) => prev + 3);
  };

  // Calculate if we have more entries to show
  const hasMoreEntries = visibleEntries < biddingHistory.length;

  // Get the currently visible entries
  const displayedEntries = biddingHistory.slice(0, visibleEntries);

  return (
    <>
      {/* Bid History Header */}
      <div className='mb-4'>
        <h3 className='text-lg'>Bid History</h3>
      </div>

      {/* Bid History Table */}
      <Table>
        <TableBody>
          {isLoading ? (
            // Loading state
            Array(3)
              .fill(0)
              .map((_, index) => (
                <TableRow
                  key={index}
                  className='animate-pulse border-b border-[#1A1A1A] bg-[#121212]'
                >
                  <TableCell className='p-2 w-1/4'>
                    <div className='flex items-center'>
                      <div className='w-8 h-8 bg-none rounded-full mr-3'></div>
                      <div>
                        <div className='h-4 bg-gray-700 rounded w-24 mb-2'></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='p-2 w-1/4 text-center'>
                    <div className='h-4 bg-gray-700 rounded w-20 mx-auto'></div>
                  </TableCell>
                  <TableCell className='p-2 w-1/4'>
                    <div className='h-4 bg-gray-700 rounded w-24 ml-auto'></div>
                  </TableCell>
                  <TableCell className='p-2 w-1/4 text-right'>
                    <div className='h-3 bg-gray-800 rounded w-16 ml-auto mb-1'></div>
                    <div className='h-3 bg-gray-800 rounded w-20 ml-auto'></div>
                  </TableCell>
                </TableRow>
              ))
          ) : biddingHistory.length === 0 ? (
            // No bid history available
            <TableRow>
              <TableCell colSpan={4} className='text-center py-4 text-gray-400'>
                No bidding history available for this contract.
              </TableCell>
            </TableRow>
          ) : (
            // Display bid history
            displayedEntries.map((bid) => (
              <TableRow
                key={bid.id}
                className='py-2 border-b-1 border-[#2C2E30] hover:bg-transparent rounded'
              >
                {/* Left side with avatar and address */}
                <TableCell className='p-2 w-1/4'>
                  <div className='flex items-center'>
                    <div className='w-8 h-8 bg-blue-600 rounded-full mr-3 flex items-center justify-center text-xs font-bold'>
                      {bid.contractName.substring(0, 2).toUpperCase() || 'CN'}
                    </div>
                    <div className='font-mono text-sm'>{bid.address}</div>
                  </div>
                </TableCell>

                {/* Center with bid information */}
                <TableCell className='p-2 w-1/4 text-center'>
                  <span className='font-medium'>Bid {bid.amount} ETH</span>
                </TableCell>

                {/* Action button */}
                <TableCell className='p-2 w-1/4 text-center'>
                  <div
                    className={`px-3 py-2 text-white text-xs rounded inline-block
                      ${
                        bid.type.includes('automatic')
                          ? 'bg-[#1A1A1A] border border-[#333]'
                          : 'bg-[#1A1A1A] border border-[#333]'
                      }`}
                  >
                    {bid.type.includes('automatic')
                      ? 'Automated Bid'
                      : 'Manual Bid'}
                  </div>
                </TableCell>

                {/* Timestamp */}
                <TableCell className='p-2 w-1/4 text-center'>
                  <div className='text-right text-gray-400 min-w-[70px]'>
                    <div className='text-xs font-medium'>
                      {bid.date.split(',')[1]?.split(' ')[1]?.trim() || ''}
                    </div>
                    <div className='text-xs'>
                      {bid.date.split(',')[0]?.replace(/\//g, '-') ||
                        '2024-02-04'}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Load More button */}
      {!isLoading && hasMoreEntries && (
        <div className='mt-4 flex justify-center'>
          <Button
            onClick={handleLoadMore}
            className='px-4 py-2 bg-[#1A1A1A] border border-[#333] text-white hover:bg-[#252525] rounded-md text-sm'
          >
            Load More Entries
          </Button>
        </div>
      )}
    </>
  );
}

function EditableContractName(
  { name, contractId, onNameChange }: EditableContractNameProps,
  ref: React.ForwardedRef<{ setEditing: (isEditing: boolean) => void }>
) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPencil, setShowPencil] = useState(false);
  const [inputValue, setInputValue] = useState(name);
  const [isLoading, setIsLoading] = useState(false);
  const contractService = useContractService();
  const { signalContractUpdated } = useContractsUpdater();

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
      setInputValue(name);
      setIsEditing(false);
      return;
    }

    if (contractService && contractId) {
      try {
        setIsLoading(true);
        await contractService.updateUserContractName(contractId, inputValue);
        onNameChange(inputValue);
        console.log('Contract name updated successfully');

        // Signal that a contract has been updated to trigger a reload
        signalContractUpdated(contractId, 'name');
      } catch (error) {
        console.error('Failed to update contract name:', error);
        // Revert to original name on error
        setInputValue(name);
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
    setInputValue(name);
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
            placeholder={name}
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
  contract,
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

  // State for bidding form (only used in my-contracts view)
  const [bidAmount, setBidAmount] = useState('');
  const [automatedBidding, setAutomatedBidding] = useState(false);

  // State for contract name
  const [contractName, setContractName] = useState(
    contract.name || 'Contract Name'
  );

  // State for the contract data with bidding history
  const [contractData, setContractData] = useState<Contract>(contract);
  const [isLoadingContract, setIsLoadingContract] = useState(false);

  // Minimum bid based on contract data or calculation
  const minBidAmount = formatEth(contractData.minBid || contractData.lastBid);

  // Fetch detailed contract data including bidding history when component mounts
  useEffect(() => {
    async function fetchContractDetails() {
      if (!contractService) return;

      try {
        setIsLoadingContract(true);
        // Get the user contract that contains the detailed contract data
        const userContract = await contractService.getUserContract(
          contractData.id
        );
        // Update the contract data with the detailed information
        if (userContract && userContract.contract) {
          setContractData(userContract.contract);
        }
      } catch (error) {
        console.error('Failed to fetch contract details:', error);
      } finally {
        setIsLoadingContract(false);
      }
    }

    // Only fetch additional details if it's a "my-contracts" view since we'll need the bidding history
    if (viewType === 'my-contracts' && !contractData.biddingHistory) {
      fetchContractDetails();
    }
  }, [contractService, contractData.id, viewType]);

  // Transform bidding history data for display
  const processBiddingHistory = (): BiddingHistoryItem[] => {
    if (!contractData.biddingHistory) return [];

    return contractData.biddingHistory.map((historyItem, index) => {
      // Determine if it's an automatic or manual bid (could be determined by some logic)
      // For now, assuming it's automatic if it's from the automation address
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
      : !isLoadingContract
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

  // Handler for bid submission (placeholder)
  const handleSubmitBid = () => {
    console.log('Submitting bid:', bidAmount);
    // Here would be API call to submit bid
  };

  // Handler for adding contract to my contracts
  const handleAddToMyContracts = () => {
    console.log('Adding contract to My Contracts:', contract.address);
    // Here would be API call to add contract
  };

  // Handler for contract alerts
  const handleContractAlerts = () => {
    console.log('Opening contract alerts for:', contract.address);
    // Here would be the implementation to manage alerts
  };

  const handleRenameContract = () => {
    console.log('Renaming contract:', contract.address);
    // Trigger edit mode in the EditableContractName component
    if (contractNameRef.current) {
      contractNameRef.current.setEditing(true);
    }
  };

  // State for contract removal and tracking API call state
  const [removeState, setRemoveState] = useState({
    isRemoving: false,
    showConfirmation: false,
  });

  const handleRemoveContract = () => {
    console.log('Removing contract:', contract.address);
    // Show confirmation dialog
    setRemoveState((prev) => ({ ...prev, showConfirmation: true }));
  };

  const cancelRemoveContract = () => {
    setRemoveState({ isRemoving: false, showConfirmation: false });
  };

  const confirmRemoveContract = async () => {
    if (!contractService) {
      console.error('Contract service not available');
      return;
    }

    try {
      // Set loading state
      setRemoveState((prev) => ({ ...prev, isRemoving: true }));

      // The deleteUserContract method returns a Promise that resolves when successful (even with 204)
      await contractService.deleteUserContract(contract.id);

      console.log('Contract removed successfully');

      // Signal that the contract was deleted to trigger a reload of the contracts list
      signalContractUpdated(contract.id, 'deleted');

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

  // Reset dialog state when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function that runs when component unmounts
      setRemoveState({ isRemoving: false, showConfirmation: false });
    };
  }, []);

  const handleManageContract = () => {
    console.log('Managing contract:', contract.address);
    // Here would be the implementation to add and manage this contract
    handleAddToMyContracts();
  };

  // Handler for name change
  const handleNameChange = (newName: string) => {
    setContractName(newName);
    console.log('Contract name changed to:', newName);
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
                    {contract.address}
                  </div>
                  <ForwardedEditableContractName
                    name={contractName}
                    contractId={contract.id}
                    onNameChange={handleNameChange}
                    ref={contractNameRef}
                  />
                </>
              ) : (
                <div className='text-2xl font-mono mb-1'>
                  {contract.address}
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

          {viewType === 'my-contracts' ? (
            <>
              {/* Main statistics in a 2-column grid layout */}
              <div className='grid grid-cols-2 gap-4 mb-6'>
                {/* Cache Status */}
                <div className='border border-[#2C2E30] rounded-md p-4'>
                  <div className='text-gray-400 text-sm'>Cache Status</div>
                  <div className='text-xl font-bold'>
                    {contract.bytecode.isCached ? 'Cached' : 'Not Cached'}
                  </div>
                  <div className='text-xs text-gray-400'>
                    Last Cached {formatDate(contract.bidBlockTimestamp)}
                  </div>
                </div>

                {/* Effective Bid */}
                <div className='border border-[#2C2E30] rounded-md p-4'>
                  <div className='text-gray-400 text-sm'>Effective Bid</div>
                  <div className='text-xl font-bold'>
                    {formatEth(contract.effectiveBid || '')}
                  </div>
                  <div className='text-xs text-gray-400'>
                    Bid: {formatEth(contract.lastBid)}
                  </div>
                </div>
              </div>

              {/* Other stats as a simple list */}
              <div className='space-y-4 mb-6'>
                {/* Eviction Risk */}
                <div className='flex justify-between items-center'>
                  <div className='text-gray-400'>Eviction Risk</div>
                  <div className='font-medium'>
                    {contract.evictionRisk ? (
                      <Badge
                        variant={getRiskBadgeVariant(
                          contract.evictionRisk.riskLevel
                        )}
                        className='px-3 py-1 text-sm font-semibold w-fit'
                      >
                        {formatRiskLevel(contract.evictionRisk.riskLevel)}
                      </Badge>
                    ) : (
                      <Badge
                        variant='outline'
                        className='px-3 py-1 text-sm font-semibold w-fit'
                      >
                        N/A
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Total Spent */}
                <div className='flex justify-between items-center'>
                  <div className='text-gray-400'>Total Spent</div>
                  <div className='font-medium'>
                    {formatEth(contract.totalBidInvestment)}
                  </div>
                </div>

                {/* Size */}
                <div className='flex justify-between items-center'>
                  <div className='text-gray-400'>Size</div>
                  <div className='font-medium'>
                    {formatSize(contract.bytecode.size)}
                  </div>
                </div>

                {/* Active Alerts */}
                <ContractAlerts
                  alerts={contract.alerts}
                  onManageAlerts={handleContractAlerts}
                />
              </div>

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

              {/* Use the new BiddingHistory component */}
              <BiddingHistory
                isLoading={isLoadingContract}
                biddingHistory={displayBidHistory}
              />
            </>
          ) : (
            /* Explore Contracts View - Updated to match image structure */
            <>
              {/* Main statistics in a 2-column grid layout */}
              <div className='grid grid-cols-2 gap-4 mb-6'>
                {/* Cache Status */}
                <div className='border border-[#2C2E30] rounded-md p-4'>
                  <div className='text-gray-400 text-sm'>Cache Status</div>
                  <div className='text-xl font-bold'>
                    {contract.bytecode.isCached ? 'Cached' : 'Not Cached'}
                  </div>
                  <div className='text-xs text-gray-400'>
                    Last Cached {formatDate(contract.bidBlockTimestamp)}
                  </div>
                </div>

                {/* Effective Bid */}
                <div className='border border-[#2C2E30] rounded-md p-4'>
                  <div className='text-gray-400 text-sm'>Effective Bid</div>
                  <div className='text-xl font-bold'>
                    {formatEth(contract.effectiveBid || '0.03')}
                  </div>
                  <div className='text-xs text-gray-400'>
                    Bid: {formatEth(contract.lastBid)}
                  </div>
                </div>
              </div>

              {/* Other stats as a simple list */}
              <div className='space-y-4 mb-6'>
                {/* Eviction Risk */}
                <div className='flex justify-between items-center'>
                  <div className='text-gray-400'>Eviction Risk</div>
                  <div className='font-medium'>
                    {contract.evictionRisk
                      ? formatRiskLevel(contract.evictionRisk.riskLevel)
                      : 'High'}
                  </div>
                </div>

                {/* Total Spent */}
                <div className='flex justify-between items-center'>
                  <div className='text-gray-400'>Total Spent</div>
                  <div className='font-medium'>
                    {formatEth(contract.totalBidInvestment || '0.9')}
                  </div>
                </div>

                {/* Size */}
                <div className='flex justify-between items-center'>
                  <div className='text-gray-400'>Size</div>
                  <div className='font-medium'>
                    {formatSize(contract.bytecode.size)}
                  </div>
                </div>
              </div>

              {/* Add to My Contracts Section */}
              <div className='border border-[#2C2E30] rounded-md p-6 mt-6 text-center'>
                <div className='flex justify-center mb-4'>
                  <div className='bg-gray-800 p-3 rounded-md'>
                    <PlusCircle className='h-6 w-6' />
                  </div>
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
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-[#121212] p-6 rounded-lg max-w-md w-full'>
            {/* Close button */}
            <div className='flex justify-end mb-2'>
              <Button
                onClick={cancelRemoveContract}
                variant='ghost'
                size='icon'
                className='h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            {/* Icon */}
            <div className='flex justify-center mb-4'>
              {/* <Image
                src='/no-contracts-found.svg'
                alt='Remove icon'
                className='h-16 w-16'
              /> */}
              <Image
                src={removeContractImage}
                alt={'remove contract'}
                width={200}
                height={200}
              />
            </div>

            {/* Title and description */}
            <h3 className='text-xl font-bold text-center mb-2'>
              Remove Contract From Your List?
            </h3>
            <p className='text-center text-gray-400 text-sm mb-6'>
              This action will remove the contract from your managed list.
              <br />
              All historical data will remain intact.
            </p>

            {/* Action buttons */}
            <div className='flex justify-center gap-3'>
              <Button
                onClick={cancelRemoveContract}
                className='bg-transparent border border-gray-600 hover:bg-gray-800 text-white text-sm px-5 py-2 h-9 rounded-md'
                disabled={removeState.isRemoving}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRemoveContract}
                className='bg-white hover:bg-gray-200 text-black font-medium text-sm px-5 py-2 h-9 rounded-md'
                disabled={removeState.isRemoving}
              >
                {removeState.isRemoving ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin text-black' />
                    Removing...
                  </>
                ) : (
                  'Remove Contract'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
