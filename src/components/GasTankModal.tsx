'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBlockchainService } from '@/hooks/useBlockchainService';
import { CACHE_MANAGER_AUTOMATION_ABI } from '@/config/abis/cacheManagerAutomation/cacheManagerAutomation';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FuelIcon as GasStation,
  ArrowUpCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { formatEther } from 'viem';
import { useReadContract, useAccount } from 'wagmi';
import { useWeb3, TransactionStatus } from '@/hooks/useWeb3';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from './ui/skeleton';
import { formatRoundedEth } from '@/utils/formatting';
import { showErrorToast } from '@/components/Toast';

export function GasTankModal() {
  // Internal state
  const [open, setOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Get the current blockchain
  const { currentBlockchain } = useBlockchainService();

  // Get the connected account
  const {
    address: userAddress,
    isConnected,
    chainId: walletChainId,
  } = useAccount();
  const isChainMismatch =
    isConnected &&
    currentBlockchain != null &&
    walletChainId !== currentBlockchain.chainId;
  const canReadBalance =
    !!currentBlockchain?.cacheManagerAutomationAddress &&
    isConnected &&
    !!userAddress &&
    !isChainMismatch;

  // Get user balance from cache manager automation contract
  const {
    data: userBalance,
    refetch: refetchBalance,
    isLoading,
  } = useReadContract({
    address: currentBlockchain?.cacheManagerAutomationAddress as `0x${string}`,
    abi: CACHE_MANAGER_AUTOMATION_ABI,
    functionName: 'getUserBalance',
    account: userAddress, // Include the user's address to properly sign the request
    chainId: currentBlockchain?.chainId,
    query: {
      enabled: canReadBalance,
    },
  });

  const refreshBalanceSafely = useCallback(() => {
    if (canReadBalance) {
      void refetchBalance();
    }
  }, [canReadBalance, refetchBalance]);

  // Use the web3 hook with its full state
  const { writeContract, status, reset } = useWeb3({
    // Set gas protection configuration
    gasProtection: {
      maxGasPriceGwei: 500, // Maximum gas price in Gwei
      gasLimit: BigInt(500000), // Gas limit
    },
  });

  // Track transaction states based on useWeb3 status
  const isTransactionInProgress =
    status === TransactionStatus.PENDING ||
    status === TransactionStatus.PREPARING;
  const isSuccess = status === TransactionStatus.SUCCESS;

  // Format balance from Wei to ETH for display
  const balanceInEth = userBalance
    ? Number(formatEther(userBalance as bigint))
    : 0;

  // Refresh balance after successful transaction
  useEffect(() => {
    if (isSuccess) {
      // Clear the deposit amount upon success
      setDepositAmount('');

      // Reset transaction state and refresh balance
      reset();
      refreshBalanceSafely();
    }
  }, [isSuccess, refreshBalanceSafely, reset]);

  function onOpenChange(open: boolean) {
    // Prevent closing if transaction is in progress
    if (isTransactionInProgress) return;

    setOpen(open);
    if (!open) {
      setDepositAmount('');
    } else {
      // Refresh balance when opening the modal
      refreshBalanceSafely();
    }
  }

  function handleDeposit() {
    const amount = Number.parseFloat(depositAmount);
    if (!isNaN(amount) && amount > 0 && currentBlockchain) {
      if (isChainMismatch) {
        showErrorToast({
          message: `Switch your wallet to ${currentBlockchain.name} before depositing funds.`,
        });
        return;
      }
      try {
        // Create transaction parameters
        const txParams = {
          address:
            currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
          abi: CACHE_MANAGER_AUTOMATION_ABI,
          functionName: 'fundBalance',
          args: [] as const, // Even though this function doesn't take args, wagmi requires this property
          value: depositAmount, // Amount to add in ETH
          chainId: currentBlockchain.chainId,
        };

        // Send the transaction
        writeContract(txParams, (hash) => {
          console.log(`Add funds transaction submitted with hash: ${hash}`);
        });
      } catch (error) {
        console.error('Deposit failed:', error);
      }
    }
  }

  function handleWithdraw() {
    if (balanceInEth > 0 && currentBlockchain) {
      if (isChainMismatch) {
        showErrorToast({
          message: `Switch your wallet to ${currentBlockchain.name} before withdrawing funds.`,
        });
        return;
      }
      try {
        // Create transaction parameters
        const txParams = {
          address:
            currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
          abi: CACHE_MANAGER_AUTOMATION_ABI,
          functionName: 'withdrawBalance',
          args: [] as const, // Even though this function doesn't take args, wagmi requires this property
          chainId: currentBlockchain.chainId,
        };

        // Send the transaction
        writeContract(txParams, (hash) => {
          console.log(
            `Withdraw funds transaction submitted with hash: ${hash}`
          );
        });
      } catch (error) {
        console.error('Withdrawal failed:', error);
      }
    }
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button variant='ghost' className='flex items-center gap-2'>
            <GasStation className='h-5 w-5' />
            {isLoading ? (
              <Skeleton className='h-4 w-[72px]' />
            ) : (
              <span>{formatRoundedEth(balanceInEth, 3)} ETH</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Gas Tank</DialogTitle>
            <DialogDescription>
              Manage your gas balance for automated bidding transactions.
            </DialogDescription>
          </DialogHeader>
          <GasTankContent
            balance={balanceInEth}
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            handleDeposit={handleDeposit}
            handleWithdraw={handleWithdraw}
            isTransactionInProgress={isTransactionInProgress}
            refreshBalance={refreshBalanceSafely}
            isBalanceLoading={isLoading}
            disclaimerChecked={disclaimerChecked}
            setDisclaimerChecked={setDisclaimerChecked}
            isChainMismatch={isChainMismatch}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant='ghost' className='flex items-center gap-2'>
          <GasStation className='h-5 w-5' />
          {isLoading ? (
            <Skeleton className='h-4 w-[72px]' />
          ) : (
            <span>{formatRoundedEth(balanceInEth, 3)} ETH</span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className='bg-surface-1 text-ink-1'>
        <DrawerHeader className='text-start'>
          <DrawerTitle className='text-[15px] font-semibold text-ink-1'>Gas Tank</DrawerTitle>
          <DrawerDescription className='text-[12.5px] text-ink-2'>
            Manage your gas balance for automated bidding transactions.
          </DrawerDescription>
        </DrawerHeader>
        <div className='px-4'>
          <GasTankContent
            balance={balanceInEth}
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            handleDeposit={handleDeposit}
            handleWithdraw={handleWithdraw}
            isTransactionInProgress={isTransactionInProgress}
            refreshBalance={refreshBalanceSafely}
            isBalanceLoading={isLoading}
            disclaimerChecked={disclaimerChecked}
            setDisclaimerChecked={setDisclaimerChecked}
            isChainMismatch={isChainMismatch}
          />
        </div>
        <DrawerFooter className='pt-2'>
          <DrawerClose asChild>
            <Button
              variant='outline'
              disabled={isTransactionInProgress}
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface GasTankContentProps {
  balance: number;
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  handleDeposit: () => void;
  handleWithdraw: () => void;
  isTransactionInProgress: boolean;
  refreshBalance: () => void;
  isBalanceLoading: boolean;
  disclaimerChecked: boolean;
  setDisclaimerChecked: (value: boolean) => void;
  isChainMismatch: boolean;
}

function GasTankContent({
  balance,
  depositAmount,
  setDepositAmount,
  handleDeposit,
  handleWithdraw,
  isTransactionInProgress,
  refreshBalance,
  isBalanceLoading,
  disclaimerChecked,
  setDisclaimerChecked,
  isChainMismatch,
}: GasTankContentProps) {
  return (
    <div className='py-4'>
      <div className='mb-6 flex flex-col items-center justify-center'>
        <div className='tile-label'>Current Balance</div>
        <div className='flex flex-col items-center'>
          <div className='stat-value flex items-center gap-2'>
            <GasStation className='h-8 w-8' />
            {isBalanceLoading ? (
              <Skeleton className='h-7 w-[157px] mt-2' />
            ) : (
              <span>{formatRoundedEth(balance, 8)} ETH</span>
            )}
          </div>
          {!isBalanceLoading && (
            <div className='text-xs text-ink-3 mt-1 self-end num'>
              {balance} ETH
            </div>
          )}
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => refreshBalance()}
          className='mt-2 text-xs text-ink-3 hover:text-ink-1'
          disabled={
            isTransactionInProgress || isBalanceLoading || isChainMismatch
          }
        >
          Refresh
        </Button>
      </div>

      <Tabs defaultValue='deposit' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger
            value='deposit'
            disabled={isTransactionInProgress || isChainMismatch}
          >
            Deposit
          </TabsTrigger>
          <TabsTrigger
            value='withdraw'
            disabled={isTransactionInProgress || isChainMismatch}
          >
            Withdraw
          </TabsTrigger>
        </TabsList>
        <TabsContent value='deposit' className='space-y-4 pt-4'>
          <div className='space-y-2'>
            <Label htmlFor='deposit-amount'>Deposit Amount (ETH)</Label>
            <div className='flex items-center gap-2'>
              <ArrowUpCircle className='h-5 w-5 text-ok-text' />
              <Input
                id='deposit-amount'
                type='number'
                placeholder='0.00'
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min='0.001'
                step='0.001'
                className={
                  isTransactionInProgress
                    ? 'cursor-not-allowed opacity-60'
                    : ''
                }
                disabled={
                  isTransactionInProgress || isBalanceLoading || isChainMismatch
                }
              />
            </div>
          </div>
          <div className='flex items-start space-x-2 mt-6'>
            <Checkbox
              id='disclaimer'
              checked={disclaimerChecked}
              onCheckedChange={(checked) =>
                setDisclaimerChecked(checked === true)
              }
              className='mt-1 data-[state=checked]:bg-accent-blue data-[state=checked]:text-white border-hairline-strong'
            />
            <Label
              htmlFor='disclaimer'
              className='text-xs text-ink-2 font-normal leading-snug'
            >
              I understand this is an experimental feature pending audit
              completion, and I accept the associated risks of using automated
              bidding. Performance may vary, and I acknowledge that I am solely
              responsible for monitoring my account.
            </Label>
          </div>
          <Button
            onClick={handleDeposit}
            className='w-full h-9 rounded-lg'
            disabled={
              isTransactionInProgress ||
              !depositAmount ||
              Number(depositAmount) <= 0 ||
              isBalanceLoading ||
              isChainMismatch ||
              !disclaimerChecked
            }
          >
            {isTransactionInProgress ? (
              <div className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>Depositing...</span>
              </div>
            ) : (
              'Deposit Gas'
            )}
          </Button>
        </TabsContent>
        <TabsContent value='withdraw' className='space-y-4 pt-4'>
          <Alert className='bg-surface-2 border-hairline rounded-[10px] mb-4'>
            <AlertCircle className='h-4 w-4 text-warn' />
            <AlertDescription className='text-[12.5px] text-ink-2 ms-2'>
              Withdrawing will remove your entire balance of {balance} ETH.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleWithdraw}
            className='w-full h-9 rounded-lg mt-4'
            disabled={
              isTransactionInProgress ||
              balance <= 0 ||
              isBalanceLoading ||
              isChainMismatch
            }
          >
            {isTransactionInProgress ? (
              <div className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>Withdrawing...</span>
              </div>
            ) : (
              'Withdraw All Gas'
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
