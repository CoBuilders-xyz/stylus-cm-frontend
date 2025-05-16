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
} from 'lucide-react';
import { Abi, formatEther } from 'viem';
import { useReadContract, useAccount } from 'wagmi';

export function GasTankModal() {
  // Internal state
  const [open, setOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
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
      setWithdrawAmount('');
    } else {
      // Refresh balance when opening the modal
      refetchBalance();
    }
  }

  async function handleDeposit() {
    const amount = Number.parseFloat(depositAmount);
    if (!isNaN(amount) && amount > 0) {
      try {
        setIsDepositing(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update balance after successful deposit
        setBalance((prevBalance) => prevBalance + amount);
        setDepositAmount('');
      } catch (error) {
        console.error('Deposit failed:', error);
      } finally {
        setIsDepositing(false);
      }
    }
  }

  async function handleWithdraw() {
    const amount = Number.parseFloat(withdrawAmount);
    if (!isNaN(amount) && amount > 0 && amount <= balance) {
      try {
        setIsWithdrawing(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update balance after successful withdrawal
        setBalance((prevBalance) => prevBalance - amount);
        setWithdrawAmount('');
      } catch (error) {
        console.error('Withdrawal failed:', error);
      } finally {
        setIsWithdrawing(false);
      }
    }
  }

  function handleSetMaxWithdraw() {
    // Set the withdraw amount to the maximum available balance
    // Format to 6 decimal places to avoid floating point precision issues
    setWithdrawAmount(balanceInEth.toFixed(6));
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
            withdrawAmount={withdrawAmount}
            setDepositAmount={setDepositAmount}
            setWithdrawAmount={setWithdrawAmount}
            handleDeposit={handleDeposit}
            handleWithdraw={handleWithdraw}
            handleSetMaxWithdraw={handleSetMaxWithdraw}
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
            Manage your gas balance for transactions.
          </DrawerDescription>
        </DrawerHeader>
        <div className='px-4'>
          <GasTankContent
            balance={balanceInEth}
            depositAmount={depositAmount}
            withdrawAmount={withdrawAmount}
            setDepositAmount={setDepositAmount}
            setWithdrawAmount={setWithdrawAmount}
            handleDeposit={handleDeposit}
            handleWithdraw={handleWithdraw}
            handleSetMaxWithdraw={handleSetMaxWithdraw}
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
  withdrawAmount: string;
  setDepositAmount: (value: string) => void;
  setWithdrawAmount: (value: string) => void;
  handleDeposit: () => void;
  handleWithdraw: () => void;
  handleSetMaxWithdraw: () => void;
  isDepositing: boolean;
  isWithdrawing: boolean;
  isTransactionPending: boolean;
  refreshBalance: () => void;
  isBalanceLoading: boolean;
}

function GasTankContent({
  balance,
  depositAmount,
  withdrawAmount,
  setDepositAmount,
  setWithdrawAmount,
  handleDeposit,
  handleWithdraw,
  handleSetMaxWithdraw,
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
          <div className='space-y-2'>
            <Label htmlFor='withdraw-amount'>Withdraw Amount (ETH)</Label>
            <div className='flex items-center gap-2'>
              <ArrowDownCircle className='h-5 w-5 text-red-500' />
              <div className='relative flex-1'>
                <Input
                  id='withdraw-amount'
                  type='number'
                  placeholder='0.00'
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min='0.001'
                  max={balance.toString()}
                  step='0.001'
                  className='bg-[#252a33] border-[#2a2d34]'
                  disabled={isTransactionPending || isBalanceLoading}
                />
                <Button
                  type='button'
                  size='sm'
                  onClick={handleSetMaxWithdraw}
                  className='absolute right-2 top-1/2 -translate-y-1/2 h-7 px-3 py-1 text-xs bg-[#2a2d34] hover:bg-[#353a44] rounded-md'
                  disabled={
                    isTransactionPending || balance <= 0 || isBalanceLoading
                  }
                >
                  Max
                </Button>
              </div>
            </div>
            <p className='text-xs text-gray-400'>
              Maximum withdrawal: {balance.toFixed(6)} ETH
            </p>
          </div>
          <Button
            onClick={handleWithdraw}
            className='w-full bg-[#252a33] hover:bg-[#2a2d34] border-[#2a2d34]'
            disabled={
              isTransactionPending ||
              !withdrawAmount ||
              Number(withdrawAmount) <= 0 ||
              Number(withdrawAmount) > balance ||
              isBalanceLoading
            }
          >
            {isWithdrawing ? (
              <div className='flex items-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                <span>Withdrawing...</span>
              </div>
            ) : (
              'Withdraw Gas'
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
