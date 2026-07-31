'use client';

import React, { useState, useRef, useEffect } from 'react';
import { formatEther } from 'viem';
import { formatRoundedEth } from '@/utils/formatting';
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
import { showSomethingWentWrongToast } from '@/components/Toast';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import ActivationTab from '@/components/ActivationTab';
import CacheHero from '@/components/CacheHero';
import {
  activationHistoryItemToEvent,
  backendProgramTimeLeft,
  buildActivationInfo,
  type ActivationEvent,
  type ActivationInfo,
} from '@/lib/activation';
import { explorerAddressUrl } from '@/utils/explorer';

/**
 * Compose an {@link ActivationInfo} from the enriched contract detail. The
 * backend detail endpoint returns both `programTimeLeft` and the decoded
 * `programTimeLeftReason` since COB-490, so no FE multicall is needed —
 * `buildActivationInfo` reads the reason off the contract directly.
 */
function resolveActivationInfo(
  contract: Contract | null | undefined
): ActivationInfo {
  if (!contract) {
    return { status: 'unknown', secondsRemaining: null, lastActivatedAt: null };
  }
  return buildActivationInfo(
    contract,
    backendProgramTimeLeft(contract.programTimeLeft)
  );
}

function buildActivationHistory(
  contract: Contract | null | undefined
): ActivationEvent[] {
  const raw = contract?.activationHistory;
  if (!raw || raw.length === 0) return [];
  // Backend is expected to return events already sorted, but a defensive
  // desc-by-timestamp sort keeps the UI stable if the ordering changes.
  return [...raw]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .map(activationHistoryItemToEvent);
}

// Explorer Link Button Component
interface ExplorerLinkButtonProps {
  chainId: string | null;
  contractAddress: string;
}

const ExplorerLinkButton: React.FC<ExplorerLinkButtonProps> = ({
  chainId,
  contractAddress,
}) => {
  const explorerUrl = explorerAddressUrl(chainId, contractAddress);
  const isEnabled = explorerUrl != null;

  return (
    <button
      className={`text-ink-3 ${
        isEnabled
          ? 'hover:text-ink-1 cursor-pointer'
          : 'opacity-50 cursor-not-allowed'
      }`}
      onClick={() => {
        if (explorerUrl) {
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

  // Chain id used by the Activation tab for its on-chain writes (Activate
  // now, auto-activation config). Prefer the contract's own chain over the
  // header selector so writes target the right chain even before the
  // header selector settles.
  const activationChainId =
    contractData?.blockchain?.chainId ?? currentBlockchain?.chainId;

  // The Activation tab is "loading" while the enriched contract fetch is
  // in flight. `isLoadingContract` is the honest signal — the previous
  // proxy (`activationHistory === undefined`) left the tab stuck on the
  // skeleton in the explore-contracts view, where `initialContractData`
  // comes from the list endpoint (no `activationHistory` field) and no
  // detail fetch ever runs. Post-COB-490 all badge-relevant fields
  // (`programTimeLeft`, `programTimeLeftReason`, `activationStatus`)
  // arrive on both endpoints, so gating on `activationHistory` was
  // over-eager anyway.
  const isActivationTabLoading = isLoadingContract;

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
      // Keep the raw ISO timestamp — `BiddingHistory` renders it with
      // locale-safe `Intl.DateTimeFormat` helpers, so pre-formatting with
      // `toLocaleString()` here would only make it re-parse a locale
      // string it can't reliably decode.
      const formattedDate = historyItem.timestamp;

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
      <div className='text-ink-1 flex flex-col h-full bg-surface-1 items-center justify-center'>
        <div className='animate-spin rounded-full h-10 w-10 border-2 border-hairline-strong border-t-accent-blue'></div>
        <p className='mt-4 text-[12.5px] text-ink-2'>Loading contract details...</p>
      </div>
    );
  }

  // If we failed to load contract data, show an error
  if (!contractData) {
    return (
      <div className='text-ink-1 flex flex-col h-full bg-surface-1 items-center justify-center p-6'>
        <div className='text-crit-text text-5xl mb-4'>!</div>
        <h3 className='text-[15px] font-semibold mb-2'>Contract Not Found</h3>
        <p className='text-ink-3 text-[12.5px] text-center mb-6'>
          We couldn&apos;t find details for this contract. It may have been
          removed or there was an error.
        </p>
        <Button variant='outline' onClick={onClose}>
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
    <div className='text-ink-1 flex flex-col h-full bg-surface-1'>
      {/* Sticky Header */}
      <div className='flex-shrink-0 bg-surface-1 border-b border-hairline px-5 py-4'>
        <div className='flex justify-between items-center gap-3'>
          <div className='min-w-0 flex-1'>
            {viewType === 'my-contracts' ? (
              <>
                <div className='mono-addr flex items-center gap-2 min-w-0'>
                  <span className='truncate'>{contractData.address}</span>
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
                <div className='mono-addr truncate'>
                  {contractData.address}
                </div>
                <div className='text-[15px] font-semibold text-ink-1 bg-transparent outline-none border-0 w-full truncate'>
                  {contractData.savedContractName}
                </div>
              </>
            ) : (
              <div className='font-mono text-sm text-ink-1 mb-1 truncate'>
                {contractData.address}
              </div>
            )}
          </div>
          <div className='flex gap-2 shrink-0'>
            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='bg-surface-2 border border-hairline text-ink-1'>
                {viewType === 'my-contracts' ? (
                  <>
                    <DropdownMenuItem
                      className='hover:bg-surface-3 cursor-pointer'
                      onClick={handleContractAlerts}
                    >
                      <BellRing className='h-4 w-4 me-2' />
                      Contract Alerts
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='hover:bg-surface-3 cursor-pointer'
                      onClick={handleRenameContract}
                    >
                      <Edit2 className='h-4 w-4 me-2' />
                      Rename Contract
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className='bg-hairline' />
                    <DropdownMenuItem
                      className='hover:bg-surface-3 cursor-pointer text-crit-text'
                      onClick={handleRemoveContract}
                    >
                      <Trash2 className='h-4 w-4 me-2' />
                      Remove Contract
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    className={`${
                      !contractData.isSavedByUser
                        ? 'hover:bg-surface-3 cursor-pointer'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                    onClick={
                      !contractData.isSavedByUser
                        ? handleManageContract
                        : undefined
                    }
                  >
                    <PlusCircle className='h-4 w-4 me-2' />
                    {contractData.isSavedByUser
                      ? 'Contract Already Added'
                      : 'Manage This Contract'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant='outline' size='icon' onClick={onClose}>
              <ChevronLast className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Main Content */}
      <ScrollArea className='panel-scroll-area flex-1 min-w-0 overscroll-contain'>
        <div className='px-5 py-4 min-w-0 overflow-x-hidden'>
          {viewType === 'my-contracts' ? (
            <Tabs defaultValue='cache' className='w-full'>
              <TabsList className='bg-surface-2 border border-hairline rounded-lg p-[2px] mb-4 overflow-x-auto max-w-full flex-nowrap'>
                <TabsTrigger
                  value='cache'
                  className='rounded-md data-[state=active]:bg-surface-3 data-[state=active]:text-ink-1 data-[state=active]:font-medium text-ink-2'
                >
                  Cache
                </TabsTrigger>
                <TabsTrigger
                  value='activation'
                  className='rounded-md data-[state=active]:bg-surface-3 data-[state=active]:text-ink-1 data-[state=active]:font-medium text-ink-2'
                >
                  Activation
                </TabsTrigger>
              </TabsList>

              <TabsContent value='cache'>
                <CacheHero
                  isCached={!!contractData?.bytecode.isCached}
                  bidBlockTimestamp={contractData?.bidBlockTimestamp}
                  effectiveBid={contractData?.effectiveBid}
                  lastBid={contractData?.lastBid}
                />

                <ContractInfo
                  contractData={contractData}
                  onManageAlerts={handleContractAlerts}
                  isLoading={isLoadingContract}
                  viewType='my-contracts'
                />

                <div className='mb-3'>
                  <h3 className='text-[15px] font-semibold text-ink-1'>Bidding</h3>
                </div>

                <div className='space-y-4 mb-8'>
                  <BidNowSection
                    contract={contractData}
                    bidAmount={bidAmount}
                    setBidAmount={setBidAmount}
                    onSuccess={reloadContractData}
                  />

                  <AutomatedBiddingSection
                    maxBidAmount={maxBidAmount}
                    setMaxBidAmount={setMaxBidAmount}
                    automationFunding={automationFunding}
                    setAutomationFunding={setAutomationFunding}
                    contract={contractData}
                    onSuccess={reloadContractData}
                  />
                </div>

                <BiddingHistory
                  isLoading={isLoadingContract}
                  biddingHistory={displayBidHistory}
                />
              </TabsContent>

              <TabsContent value='activation'>
                {/*
                  Key on the contract address so switching contracts inside
                  the same side panel remounts the tab — the auto-activation
                  form is user-owned local state (no re-sync from props by
                  design) and would otherwise leak the previous contract's
                  edits into a Save against the new contract.
                */}
                <ActivationTab
                  key={contractData?.address}
                  activation={resolveActivationInfo(contractData)}
                  history={buildActivationHistory(contractData)}
                  autoActivate={contractData?.autoActivate}
                  maxActivationCost={contractData?.maxActivationCost}
                  chainId={activationChainId}
                  chainName={
                    contractData?.blockchain?.name ??
                    currentBlockchain?.name
                  }
                  contractAddress={contractData?.address}
                  cmaAddress={
                    contractData?.blockchain?.cacheManagerAutomationAddress as
                      | `0x${string}`
                      | undefined
                  }
                  onActivated={reloadContractData}
                  onConfigSaved={reloadContractData}
                  isLoading={isActivationTabLoading}
                />
              </TabsContent>

            </Tabs>
          ) : (
            /* Explore Contracts View */
            <>
            <Tabs defaultValue='cache' className='w-full'>
              <TabsList className='bg-surface-2 border border-hairline rounded-lg p-[2px] mb-4 overflow-x-auto max-w-full flex-nowrap'>
                <TabsTrigger
                  value='cache'
                  className='rounded-md data-[state=active]:bg-surface-3 data-[state=active]:text-ink-1 data-[state=active]:font-medium text-ink-2'
                >
                  Cache
                </TabsTrigger>
                <TabsTrigger
                  value='activation'
                  className='rounded-md data-[state=active]:bg-surface-3 data-[state=active]:text-ink-1 data-[state=active]:font-medium text-ink-2'
                >
                  Activation
                </TabsTrigger>
              </TabsList>

              <TabsContent value='cache'>
                <CacheHero
                  isCached={!!contractData?.bytecode.isCached}
                  bidBlockTimestamp={contractData?.bidBlockTimestamp}
                  effectiveBid={contractData?.effectiveBid}
                  lastBid={contractData?.lastBid}
                />

                <ContractInfo
                  contractData={contractData}
                  onManageAlerts={handleContractAlerts}
                  isLoading={isLoadingContract}
                  viewType='explore-contracts'
                />
              </TabsContent>

              <TabsContent value='activation'>
                <ActivationTab
                  activation={resolveActivationInfo(contractData)}
                  history={buildActivationHistory(contractData)}
                  chainId={activationChainId}
                  isLoading={isActivationTabLoading}
                  readOnly
                />
              </TabsContent>
            </Tabs>

            {/* Add to My Contracts Section */}
              <div className='px-4 text-center'>
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
                    <h3 className='text-[15px] font-semibold text-ink-1 mb-2'>
                      Add this contract to place bids
                    </h3>
                    <p className='text-ink-3 text-[12.5px] mb-4'>
                      Add this contract to your managed list to place bids, set
                      automations and more.
                    </p>
                    <Button onClick={handleManageContract}>
                      Add to My Contracts
                    </Button>
                  </>
                ) : (
                  <>
                    <div className='flex justify-center'>
                      <Badge
                        variant='secondary'
                        className='px-3 py-1.5 text-[12.5px] font-medium'
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
