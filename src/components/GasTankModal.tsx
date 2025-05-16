'use client';

import { useState } from 'react';
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
import {
  FuelIcon as GasStation,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
} from 'lucide-react';
import { type Abi, formatEther } from 'viem';
import { useReadContract, useAccount } from 'wagmi';
import { useWeb3 } from '@/hooks/useWeb3';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function GasTankModal() {
  // Internal state
  const [open, setOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
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

  // Get the write contract function
  const {
    writeContract,
    // , status, error, reset, gasPriceGwei, isGasPriceHigh
  } = useWeb3({
    // Set gas protection configuration
    gasProtection: {
      maxGasPriceGwei: 500, // Maximum gas price in Gwei
      gasLimit: BigInt(500000), // Gas limit
    },
  });

  // Format balance from Wei to ETH for display
  const balanceInEth = userBalance
    ? Number(formatEther(userBalance as bigint))
    : 0;

  // Determine if any transaction is pending
  const isTransactionPending = isDepositing || isWithdrawing;

  function onOpenChange(open: boolean) {
    // Prevent closing if transaction is pending
    if (isTransactionPending) return;

    setOpen(open);
    if (!open) {
      setDepositAmount('');
    } else {
      // Refresh balance when opening the modal
      refetchBalance();
    }
  }

  async function handleDeposit() {
    const amount = Number.parseFloat(depositAmount);
    if (!isNaN(amount) && amount > 0 && currentBlockchain) {
      try {
        setIsDepositing(true);

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

        // Clear input and refresh balance
        setDepositAmount('');
        await refetchBalance();
      } catch (error) {
        console.error('Deposit failed:', error);
      } finally {
        setIsDepositing(false);
      }
    }
  }

  async function handleWithdraw() {
    if (balanceInEth > 0 && currentBlockchain) {
      try {
        setIsWithdrawing(true);

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

        await refetchBalance();
      } catch (error) {
        console.error('Withdrawal failed:', error);
      } finally {
        setIsWithdrawing(false);
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
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
            ) : (
              <span>{balanceInEth.toFixed(3)} ETH</span>
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
            isDepositing={isDepositing}
            isWithdrawing={isWithdrawing}
            isTransactionPending={isTransactionPending}
            refreshBalance={refetchBalance}
            isBalanceLoading={isLoading}
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
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
          ) : (
            <span>{balanceInEth.toFixed(3)} ETH</span>
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
            isDepositing={isDepositing}
            isWithdrawing={isWithdrawing}
            isTransactionPending={isTransactionPending}
            refreshBalance={refetchBalance}
            isBalanceLoading={isLoading}
          />
        </div>
        <DrawerFooter className='pt-2'>
          <DrawerClose asChild>
            <Button
              variant='outline'
              className='border-[#2a2d34] bg-[#252a33] hover:bg-[#2a2d34] hover:text-white'
              disabled={isTransactionPending}
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
  isDepositing: boolean;
  isWithdrawing: boolean;
  isTransactionPending: boolean;
  refreshBalance: () => void;
  isBalanceLoading: boolean;
}

function GasTankContent({
  balance,
  depositAmount,
  setDepositAmount,
  handleDeposit,
  handleWithdraw,
  isDepositing,
  isWithdrawing,
  isTransactionPending,
  refreshBalance,
  isBalanceLoading,
}: GasTankContentProps) {
  return (
    <div className='py-4'>
      <div className='mb-6 flex flex-col items-center justify-center'>
        <div className='text-sm text-gray-400'>Current Balance</div>
        <div className='flex items-center gap-2 text-3xl font-bold'>
          <GasStation className='h-8 w-8' />
          {isBalanceLoading ? (
            <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
          ) : (
            <span>{balance.toFixed(3)} ETH</span>
          )}
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => refreshBalance()}
          className='mt-2 text-xs text-gray-400 hover:text-white'
          disabled={isTransactionPending || isBalanceLoading}
        >
          Refresh
        </Button>
      </div>

      <Tabs defaultValue='deposit' className='w-full'>
        <TabsList className='grid w-full grid-cols-2 bg-[#252a33] rounded-md p-1'>
          <TabsTrigger
            value='deposit'
            className='rounded-md data-[state=active]:bg-[#1a1d24] data-[state=active]:shadow-none'
            disabled={isTransactionPending}
          >
            Deposit
          </TabsTrigger>
          <TabsTrigger
            value='withdraw'
            className='rounded-md data-[state=active]:bg-[#1a1d24] data-[state=active]:shadow-none'
            disabled={isTransactionPending}
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
                className='bg-[#252a33] border-[#2a2d34]'
                disabled={isTransactionPending || isBalanceLoading}
              />
            </div>
          </div>
          <Button
            onClick={handleDeposit}
            className='w-full bg-[#252a33] hover:bg-[#2a2d34] border-[#2a2d34]'
            disabled={
              isTransactionPending ||
              !depositAmount ||
              Number(depositAmount) <= 0 ||
              isBalanceLoading
            }
          >
            {isDepositing ? (
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
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
              Withdrawing will remove your entire balance of{' '}
              {balance.toFixed(6)} ETH.
            </AlertDescription>
          </Alert>

          <div className='flex items-center justify-between'>
            <div>
              <div className='text-sm font-medium'>Available to withdraw</div>
              <div className='text-2xl font-bold'>{balance.toFixed(6)} ETH</div>
            </div>
            <ArrowDownCircle className='h-6 w-6 text-red-500' />
          </div>

          <Button
            onClick={handleWithdraw}
            className='w-full bg-[#252a33] hover:bg-[#2a2d34] border-[#2a2d34] mt-4'
            disabled={isTransactionPending || balance <= 0 || isBalanceLoading}
          >
            {isWithdrawing ? (
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
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
