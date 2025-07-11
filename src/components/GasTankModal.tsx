'use client';

import { useState, useEffect } from 'react';
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
import cacheManagerAutomationAbi from '@/config/abis/cacheManagerAutomation/CacheManagerAutomation.json';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FuelIcon as GasStation,
  ArrowUpCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { type Abi, formatEther } from 'viem';
import { useReadContract, useAccount } from 'wagmi';
import { useWeb3, TransactionStatus } from '@/hooks/useWeb3';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from './ui/skeleton';
import { formatRoundedEth } from '@/utils/formatting';

export function GasTankModal() {
  // Internal state
  const [open, setOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Get the current blockchain
  const { currentBlockchain } = useBlockchainService();

  // Get the connected account
  const { address: userAddress, isConnected } = useAccount();

  // Get user balance from cache manager automation contract
  const {
    data: userBalance,
    refetch: refetchBalance,
    isLoading,
  } = useReadContract({
    address: currentBlockchain?.cacheManagerAutomationAddress as `0x${string}`,
    abi: cacheManagerAutomationAbi.abi as Abi,
    functionName: 'getUserBalance',
    account: userAddress, // Include the user's address to properly sign the request
    query: {
      enabled:
        !!currentBlockchain?.cacheManagerAutomationAddress &&
        isConnected &&
        !!userAddress,
    },
  });

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
      refetchBalance();
    }
  }, [isSuccess, reset, refetchBalance]);

  function onOpenChange(open: boolean) {
    // Prevent closing if transaction is in progress
    if (isTransactionInProgress) return;

    setOpen(open);
    if (!open) {
      setDepositAmount('');
    } else {
      // Refresh balance when opening the modal
      refetchBalance();
    }
  }

  function handleDeposit() {
    const amount = Number.parseFloat(depositAmount);
    if (!isNaN(amount) && amount > 0 && currentBlockchain) {
      try {
        // Create transaction parameters
        const txParams = {
          address:
            currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
          abi: cacheManagerAutomationAbi.abi as Abi,
          functionName: 'fundBalance',
          args: [] as const, // Even though this function doesn't take args, wagmi requires this property
          value: depositAmount, // Amount to add in ETH
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
      try {
        // Create transaction parameters
        const txParams = {
          address:
            currentBlockchain.cacheManagerAutomationAddress as `0x${string}`,
          abi: cacheManagerAutomationAbi.abi as Abi,
          functionName: 'withdrawBalance',
          args: [] as const, // Even though this function doesn't take args, wagmi requires this property
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
        <DialogContent className='sm:max-w-[425px] bg-[#1a1d24] border-[#2a2d34] text-white'>
          <DialogHeader>
            <DialogTitle>Gas Tank</DialogTitle>
            <DialogDescription className='text-gray-400'>
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
            refreshBalance={refetchBalance}
            isBalanceLoading={isLoading}
            disclaimerChecked={disclaimerChecked}
            setDisclaimerChecked={setDisclaimerChecked}
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
      <DrawerContent className='bg-[#1a1d24] text-white'>
        <DrawerHeader className='text-left'>
          <DrawerTitle>Gas Tank</DrawerTitle>
          <DrawerDescription className='text-gray-400'>
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
            refreshBalance={refetchBalance}
            isBalanceLoading={isLoading}
            disclaimerChecked={disclaimerChecked}
            setDisclaimerChecked={setDisclaimerChecked}
          />
        </div>
        <DrawerFooter className='pt-2'>
          <DrawerClose asChild>
            <Button
              variant='outline'
              className='border-[#2a2d34] bg-[#252a33] hover:bg-[#2a2d34] hover:text-white'
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
}: GasTankContentProps) {
  return (
    <div className='py-4'>
      <div className='mb-6 flex flex-col items-center justify-center'>
        <div className='text-sm text-gray-400'>Current Balance</div>
        <div className='flex flex-col items-center'>
          <div className='flex items-center gap-2 text-3xl font-bold'>
            <GasStation className='h-8 w-8' />
            {isBalanceLoading ? (
              <Skeleton className='h-7 w-[157px] mt-2' />
            ) : (
              <span>{formatRoundedEth(balance, 8)} ETH</span>
            )}
          </div>
          {!isBalanceLoading && (
            <div className='text-xs text-gray-500 mt-1 self-end'>
              {balance} ETH
            </div>
          )}
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => refreshBalance()}
          className='mt-2 text-xs text-gray-400 hover:text-white'
          disabled={isTransactionInProgress || isBalanceLoading}
        >
          Refresh
        </Button>
      </div>

      <Tabs defaultValue='deposit' className='w-full'>
        <TabsList className='grid w-full grid-cols-2 bg-[#252a33] rounded-md p-1'>
          <TabsTrigger
            value='deposit'
            className='rounded-md data-[state=active]:bg-[#1a1d24] data-[state=active]:shadow-none'
            disabled={isTransactionInProgress}
          >
            Deposit
          </TabsTrigger>
          <TabsTrigger
            value='withdraw'
            className='rounded-md data-[state=active]:bg-[#1a1d24] data-[state=active]:shadow-none'
            disabled={isTransactionInProgress}
          >
            Withdraw
          </TabsTrigger>
        </TabsList>
        <TabsContent value='deposit' className='space-y-4 pt-4'>
          <div className='space-y-2'>
            <Label htmlFor='deposit-amount'>Deposit Amount (ETH)</Label>
            <div className='flex items-center gap-2'>
              <ArrowUpCircle className='h-5 w-5 text-green-500' />
              <Input
                id='deposit-amount'
                type='number'
                placeholder='0.00'
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min='0.001'
                step='0.001'
                className={`bg-[#252a33] border-[#2a2d34] ${
                  isTransactionInProgress
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-60'
                    : ''
                }`}
                disabled={isTransactionInProgress || isBalanceLoading}
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
              className='mt-1 data-[state=checked]:bg-white data-[state=checked]:text-blue-600 border-white'
            />
            <Label
              htmlFor='disclaimer'
              className='text-sm font-medium leading-tight'
            >
              I&apos;m aware this is an experimental feature until audit
              compeltion and understand the risks associated with automated
              bidding. Results may vary and I&apos;m responsible for monitoring
              my account.
            </Label>
          </div>
          <Button
            onClick={handleDeposit}
            className='w-full bg-[#252a33] hover:bg-[#2a2d34] border-[#2a2d34]'
            disabled={
              isTransactionInProgress ||
              !depositAmount ||
              Number(depositAmount) <= 0 ||
              isBalanceLoading ||
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
          <Alert className='bg-[#252a33] border-[#2a2d34] mb-4'>
            <AlertCircle className='h-4 w-4 text-yellow-500' />
            <AlertDescription className='text-sm text-gray-300 ml-2'>
              Withdrawing will remove your entire balance of {balance} ETH.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleWithdraw}
            className='w-full bg-[#252a33] hover:bg-[#2a2d34] border-[#2a2d34] mt-4'
            disabled={
              isTransactionInProgress || balance <= 0 || isBalanceLoading
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
