'use client';

import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useBidAverage, BidAverageSizeRange } from '@/hooks/useBidAverage';
import { BidAverageTimespan } from '@/services/cacheMetricsService';
import { formatRoundedEth } from '@/utils/formatting';
import { Skeleton } from '@/components/ui/skeleton';

// Chart configuration
const chartConfig = {
  averageBid: {
    label: 'Average Bid',
    color: '#4267B2', // Using a blue color similar to the bars in the image
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
  // Use the bid average hook instead of mock data and local state
  const {
    bidAverageData,
    isLoading,
    error,
    timespan,
    sizeRange,
    setTimespan,
    setSizeRange,
  } = useBidAverage('D', 'small');

  // Process data for chart
  const chartData = useMemo(() => {
    if (!bidAverageData || !bidAverageData.periods) {
      return [];
    }

    return bidAverageData.periods.map((item) => ({
      date: item.period,
      averageBid: parseFloat(item.parsedAverageBid),
      formattedAverageBid: formatRoundedEth(item.parsedAverageBid, 5),
      count: item.count,
    }));
  }, [bidAverageData]);

  // Formatted global average
  const globalAverageBid = useMemo(() => {
    if (!bidAverageData || !bidAverageData.global) {
      return '0.00';
    }
    return formatRoundedEth(bidAverageData.global.parsedAverageBid, 5);
  }, [bidAverageData]);

  // Custom styles
  const customStyles = {
    card: {
      backgroundColor: '#1A1919',
      border: 'none',
    },
    title: {
      color: '#FFFFFF',
    },
    globalValue: {
      color: '#FFFFFF',
    },
    description: {
      color: '#B1B1B1',
    },
    toggleButton: {
      backgroundColor: '#1A1919',
      color: '#B1B1B1',
      border: '1px solid #2C2E30',
      borderRadius: '0',
      margin: '0',
    },
    toggleButtonActive: {
      backgroundColor: '#2C2E30',
      color: '#FFFFFF',
      border: '1px solid #2C2E30',
      borderRadius: '0',
      margin: '0',
    },
    toggleGroup: {
      backgroundColor: '#1A1919',
      border: '1px solid #2C2E30',
      borderRadius: '8px',
      padding: '0',
      overflow: 'hidden',
    },
    yAxis: {
      color: '#B1B1B1',
    },
    xAxis: {
      color: '#B1B1B1',
    },
    grid: {
      stroke: '#2C2E30',
    },
  };

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const formattedDate = new Date(label).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return (
      <div
        style={{
          backgroundColor: '#1A1919',
          border: '1px solid #2C2E30',
          padding: '10px',
          borderRadius: '4px',
        }}
      >
        <p
          style={{ color: '#FFFFFF', marginBottom: '4px', fontWeight: 'bold' }}
        >
          {formattedDate}
        </p>
        {payload.map((entry, index) => (
          <div
            key={`item-${index}`}
            style={{
              color: '#B1B1B1',
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '3px',
            }}
          >
            <span style={{ marginRight: '8px' }}>
              {entry.name === 'averageBid' ? 'Average Bid' : entry.name}:
            </span>
            <span style={{ fontWeight: 'bold' }}>
              {entry.name === 'averageBid'
                ? `${payload[0].payload.formattedAverageBid} ETH`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Handle timespan change
  const handleTimespanChange = (value: string) => {
    if (value) {
      setTimespan(value as BidAverageTimespan);
    }
  };

  // Handle contract size change
  const handleContractSizeChange = (value: string) => {
    if (value) {
      setSizeRange(value as BidAverageSizeRange);
    }
  };

  return (
    <Card
      className='@container/card'
      style={{ ...customStyles.card, borderRadius: '12px' }}
    >
      <CardHeader className='relative'>
        <div className='flex flex-col gap-1'>
          <CardTitle className='text-2xl font-bold' style={customStyles.title}>
            Average Bid
          </CardTitle>
          <div className='text-4xl font-bold' style={customStyles.globalValue}>
            {isLoading ? (
              <Skeleton className='h-10 w-32 bg-slate-700' />
            ) : (
              `${globalAverageBid} ETH`
            )}
          </div>
          <CardDescription
            className='text-base'
            style={customStyles.description}
          >
            Average bid recorded during the period for the selected contract
            size group
          </CardDescription>
        </div>
        <div className='absolute right-4 top-4'>
          <ToggleGroup
            type='single'
            value={timespan}
            onValueChange={handleTimespanChange}
            variant='outline'
            className='hidden md:flex'
            style={customStyles.toggleGroup}
          >
            {timespanOptions.map((option, index) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className='h-8 w-10 px-2.5 font-medium data-[state=on]:bg-transparent'
                style={{
                  ...(option.value === timespan
                    ? customStyles.toggleButtonActive
                    : customStyles.toggleButton),
                  borderRight:
                    index === timespanOptions.length - 1
                      ? 'none'
                      : '1px solid #2C2E30',
                  borderLeft: index === 0 ? 'none' : 'none',
                }}
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={timespan} onValueChange={handleTimespanChange}>
            <SelectTrigger
              className='md:hidden flex w-40'
              aria-label='Select a timespan'
              style={{
                backgroundColor: '#1A1919',
                color: '#FFFFFF',
                border: '1px solid #2C2E30',
              }}
            >
              <SelectValue placeholder='Select timespan' />
            </SelectTrigger>
            <SelectContent
              className='rounded-xl'
              style={{
                backgroundColor: '#1A1919',
                border: '1px solid #2C2E30',
              }}
            >
              {timespanOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className='rounded-lg'
                  style={{
                    color: option.value === timespan ? '#FFFFFF' : '#B1B1B1',
                    backgroundColor:
                      option.value === timespan ? '#2C2E30' : '#1A1919',
                  }}
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
          value={sizeRange}
          onValueChange={handleContractSizeChange}
          variant='outline'
          className='w-full grid grid-cols-3'
          style={customStyles.toggleGroup}
        >
          {contractSizeOptions.map((option, index) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className='h-10 px-2 py-2 text-center data-[state=on]:bg-transparent'
              variant='outline'
              style={{
                ...(option.value === sizeRange
                  ? customStyles.toggleButtonActive
                  : customStyles.toggleButton),
                borderRight:
                  index === contractSizeOptions.length - 1
                    ? 'none'
                    : '1px solid #2C2E30',
                borderLeft: index === 0 ? 'none' : 'none',
              }}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <CardContent className='px-2 pt-0 sm:px-6'>
        {isLoading ? (
          <div className='aspect-auto h-[250px] w-full flex items-center justify-center'>
            <Skeleton className='h-[200px] w-full bg-slate-700' />
          </div>
        ) : error ? (
          <div className='aspect-auto h-[250px] w-full flex items-center justify-center text-center text-red-500'>
            Error loading chart data. Please try again.
          </div>
        ) : chartData.length === 0 ? (
          <div className='aspect-auto h-[250px] w-full flex items-center justify-center text-center text-gray-400'>
            No data available for the selected filters.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[250px] w-full'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id='fillAverageBid'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='5%' stopColor='#4267B2' stopOpacity={0.8} />
                    <stop offset='95%' stopColor='#4267B2' stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray='3 3'
                  stroke={customStyles.grid.stroke}
                />
                <XAxis
                  dataKey='date'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tick={{ fill: customStyles.xAxis.color }}
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
                  tick={{ fill: customStyles.yAxis.color }}
                  tickFormatter={(value) => `${formatRoundedEth(value, 5)} ETH`}
                  width={80}
                />
                <Tooltip cursor={false} content={<CustomTooltip />} />
                <Area
                  dataKey='averageBid'
                  type='monotone'
                  fill='url(#fillAverageBid)'
                  stroke='#4267B2'
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
