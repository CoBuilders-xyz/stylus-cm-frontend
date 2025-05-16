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
import {
  FuelIcon as GasStation,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';

interface GasTankProps {
  balance: number;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
}

export function GasTankModal({
  balance = 0.05,
  onDeposit = () => {},
  onWithdraw = () => {},
}: GasTankProps) {
  const [open, setOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const isDesktop = useMediaQuery('(min-width: 768px)');

  function onOpenChange(open: boolean) {
    setOpen(open);
    if (!open) {
      setDepositAmount('');
      setWithdrawAmount('');
    }
  }

  function handleDeposit() {
    const amount = Number.parseFloat(depositAmount);
    if (!isNaN(amount) && amount > 0) {
      onDeposit(amount);
      setDepositAmount('');
    }
  }

  function handleWithdraw() {
    const amount = Number.parseFloat(withdrawAmount);
    if (!isNaN(amount) && amount > 0 && amount <= balance) {
      onWithdraw(amount);
      setWithdrawAmount('');
    }
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button variant='ghost' className='flex items-center gap-2'>
            <GasStation className='h-5 w-5' />
            <span>{balance.toFixed(3)} ETH</span>
          </Button>
        </DialogTrigger>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Gas Tank</DialogTitle>
            <DialogDescription>
              Manage your gas balance for transactions.
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
          <span>{balance.toFixed(3)} ETH</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className='text-left'>
          <DrawerTitle>Gas Tank</DrawerTitle>
          <DrawerDescription>
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
          />
        </div>
        <DrawerFooter className='pt-2'>
          <DrawerClose asChild>
            <Button variant='outline'>Close</Button>
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
}

function GasTankContent({
  balance,
  depositAmount,
  withdrawAmount,
  setDepositAmount,
  setWithdrawAmount,
  handleDeposit,
  handleWithdraw,
}: GasTankContentProps) {
  return (
    <div className='py-4'>
      <div className='mb-6 flex flex-col items-center justify-center'>
        <div className='text-sm text-muted-foreground'>Current Balance</div>
        <div className='flex items-center gap-2 text-3xl font-bold'>
          <GasStation className='h-8 w-8' />
          <span>{balance.toFixed(3)} ETH</span>
        </div>
      </div>

      <Tabs defaultValue='deposit' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='deposit'>Deposit</TabsTrigger>
          <TabsTrigger value='withdraw'>Withdraw</TabsTrigger>
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
              />
            </div>
          </div>
          <Button onClick={handleDeposit} className='w-full'>
            Deposit Gas
          </Button>
        </TabsContent>
        <TabsContent value='withdraw' className='space-y-4 pt-4'>
          <div className='space-y-2'>
            <Label htmlFor='withdraw-amount'>Withdraw Amount (ETH)</Label>
            <div className='flex items-center gap-2'>
              <ArrowDownCircle className='h-5 w-5 text-red-500' />
              <Input
                id='withdraw-amount'
                type='number'
                placeholder='0.00'
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min='0.001'
                max={balance.toString()}
                step='0.001'
              />
            </div>
            <p className='text-xs text-muted-foreground'>
              Maximum withdrawal: {balance.toFixed(3)} ETH
            </p>
          </div>
          <Button
            onClick={handleWithdraw}
            className='w-full'
            disabled={
              Number.parseFloat(withdrawAmount) > balance ||
              Number.parseFloat(withdrawAmount) <= 0
            }
          >
            Withdraw Gas
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
