'use client';

import React, { useState, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Mock data based on the provided structure
const mockData = {
  periods: [
    {
      period: '2025-01-15',
      averageBid: '3627218218350321',
      parsedAverageBid: '0.020',
      count: 39,
    },
    {
      period: '2025-02-15',
      averageBid: '10128096254897959',
      parsedAverageBid: '0.050',
      count: 49,
    },
    {
      period: '2025-03-15',
      averageBid: '6977974526506491',
      parsedAverageBid: '0.075',
      count: 18,
    },
    {
      period: '2025-04-15',
      averageBid: '4174129200454426',
      parsedAverageBid: '0.040',
      count: 73,
    },
    {
      period: '2025-05-15',
      averageBid: '1578190064375000',
      parsedAverageBid: '0.010',
      count: 16,
    },
    {
      period: '2025-06-15',
      averageBid: '2187500000000000',
      parsedAverageBid: '0.025',
      count: 8,
    },
  ],
  global: {
    averageBid: '3954700695300258',
    parsedAverageBid: '0.05',
    count: 203,
  },
};

// Chart configuration
const chartConfig = {
  averageBid: {
    label: 'Average Bid',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

// Available timespan options
const timespanOptions = [
  { value: 'D', label: 'D' },
  { value: 'W', label: 'W' },
  { value: 'M', label: 'M' },
  { value: 'Y', label: 'Y' },
];

// Contract size options
const contractSizeOptions = [
  { value: 'small', label: '<8 KB' },
  { value: 'medium', label: '8 KB to 16 KB' },
  { value: 'large', label: '>16 KB' },
];

export default function CacheAverageBid() {
  const [timespan, setTimespan] = useState<string>('D');
  const [contractSize, setContractSize] = useState<string>('medium');

  // Process data for chart
  const chartData = useMemo(() => {
    return mockData.periods.map((item) => ({
      date: item.period,
      averageBid: parseFloat(item.parsedAverageBid),
      count: item.count,
    }));
  }, []);

  return (
    <Card className='@container/card'>
      <CardHeader className='relative'>
        <div className='flex flex-col gap-1'>
          <CardTitle className='text-2xl font-bold'>Average Bid</CardTitle>
          <div className='text-4xl font-bold'>
            {mockData.global.parsedAverageBid} ETH
          </div>
          <CardDescription className='text-base'>
            Average bid recorded during the period for the selected contract
            size group
          </CardDescription>
        </div>
        <div className='absolute right-4 top-4'>
          <ToggleGroup
            type='single'
            value={timespan}
            onValueChange={(value) => value && setTimespan(value)}
            variant='outline'
            className='hidden md:flex'
          >
            {timespanOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className='h-8 w-10 px-2.5 font-medium'
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={timespan} onValueChange={setTimespan}>
            <SelectTrigger
              className='md:hidden flex w-40'
              aria-label='Select a timespan'
            >
              <SelectValue placeholder='Select timespan' />
            </SelectTrigger>
            <SelectContent className='rounded-xl'>
              {timespanOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className='rounded-lg'
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {/* Contract size selector */}
      <div className='px-6 mb-4'>
        <ToggleGroup
          type='single'
          value={contractSize}
          onValueChange={(value) => value && setContractSize(value)}
          variant='outline'
          className='w-full grid grid-cols-3'
        >
          {contractSizeOptions.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className='h-10 px-2 py-2 text-center'
              variant='outline'
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <CardContent className='px-2 pt-0 sm:px-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id='fillAverageBid' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='var(--color-averageBid)'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--color-averageBid)'
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray='3 3' />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value} ETH`}
                width={80}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      });
                    }}
                    formatter={(value, name) => {
                      if (name === 'averageBid') {
                        return [`${value} ETH`, 'Average Bid'];
                      }
                      return [value, name];
                    }}
                    indicator='dot'
                  />
                }
              />
              <Area
                dataKey='averageBid'
                type='monotone'
                fill='url(#fillAverageBid)'
                stroke='var(--color-averageBid)'
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
