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
import {
  FuelIcon as GasStation,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';

export function GasTankModal() {
  const [balance, setBalance] = useState(0);
  const [open, setOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Determine if any transaction is pending
  const isTransactionPending = isDepositing || isWithdrawing;

  // Fetch balance on component mount
  useEffect(() => {
    fetchBalance();
  }, []);

  // Function to fetch the user's gas balance
  async function fetchBalance() {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock balance - in a real app, this would come from your blockchain API
      const fetchedBalance = 0.05;
      setBalance(fetchedBalance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function onOpenChange(open: boolean) {
    // Prevent closing if transaction is pending
    if (isTransactionPending) return;

    setOpen(open);
    if (!open) {
      setDepositAmount('');
      setWithdrawAmount('');
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
    setWithdrawAmount(balance.toString());
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
              <span>{balance.toFixed(3)} ETH</span>
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
            balance={balance}
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
            refreshBalance={fetchBalance}
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
            <span>{balance.toFixed(3)} ETH</span>
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
            balance={balance}
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
            refreshBalance={fetchBalance}
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
}: GasTankContentProps) {
  return (
    <div className='py-4'>
      <div className='mb-6 flex flex-col items-center justify-center'>
        <div className='text-sm text-gray-400'>Current Balance</div>
        <div className='flex items-center gap-2 text-3xl font-bold'>
          <GasStation className='h-8 w-8' />
          <span>{balance.toFixed(3)} ETH</span>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={refreshBalance}
          className='mt-2 text-xs text-gray-400 hover:text-white'
          disabled={isTransactionPending}
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
                disabled={isTransactionPending}
              />
            </div>
          </div>
          <Button
            onClick={handleDeposit}
            className='w-full bg-[#252a33] hover:bg-[#2a2d34] border-[#2a2d34]'
            disabled={
              isTransactionPending ||
              !depositAmount ||
              Number(depositAmount) <= 0
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
                  disabled={isTransactionPending}
                />
                <Button
                  type='button'
                  size='sm'
                  onClick={handleSetMaxWithdraw}
                  className='absolute right-2 top-1/2 -translate-y-1/2 h-7 px-3 py-1 text-xs bg-[#2a2d34] hover:bg-[#353a44] rounded-md'
                  disabled={isTransactionPending || balance <= 0}
                >
                  Max
                </Button>
              </div>
            </div>
            <p className='text-xs text-gray-400'>
              Maximum withdrawal: {balance.toFixed(3)} ETH
            </p>
          </div>
          <Button
            onClick={handleWithdraw}
            className='w-full bg-[#252a33] hover:bg-[#2a2d34] border-[#2a2d34]'
            disabled={
              isTransactionPending ||
              !withdrawAmount ||
              Number(withdrawAmount) <= 0 ||
              Number(withdrawAmount) > balance
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
