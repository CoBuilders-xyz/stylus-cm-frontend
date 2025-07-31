'use client';

import React, { useMemo, useState } from 'react';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBidAverage } from '@/hooks/useBidAverage';
import { BidAverageTimespan } from '@/services/cacheMetricsService';
import { formatRoundedEth, formatETHForAxis } from '@/utils/formatting';
import { Skeleton } from '@/components/ui/skeleton';

// Chart configuration for multiple lines
const chartConfig = {
  small: {
    label: '<8 KB',
    color: '#3B82F6', // Blue
  },
  medium: {
    label: '8-16 KB',
    color: '#10B981', // Green
  },
  large: {
    label: '>16 KB',
    color: '#F59E0B', // Orange
  },
} satisfies ChartConfig;

// Available timespan options
const timespanOptions = [
  { value: 'D', label: 'D' },
  { value: 'W', label: 'W' },
  { value: 'M', label: 'M' },
  { value: 'Y', label: 'Y' },
];

// Contract size options with their display labels
const contractSizeOptions = [
  { value: 'small', label: '<8 KB' },
  { value: 'medium', label: '8-16 KB' },
  { value: 'large', label: '>16 KB' },
];

type ContractSize = 'small' | 'medium' | 'large';

export default function CacheAverageBid() {
  // State for hover interactions
  const [hoveredSize, setHoveredSize] = useState<ContractSize | null>(null);

  // Get data for all contract sizes
  const smallData = useBidAverage('D', 'small');
  const mediumData = useBidAverage('D', 'medium');
  const largeData = useBidAverage('D', 'large');

  // Use the first hook for timespan control
  const { timespan, currentBlockchainId } = smallData;

  // Handle timespan change - update all hooks
  const handleTimespanChange = (value: string) => {
    if (value) {
      const newTimespan = value as BidAverageTimespan;
      smallData.setTimespan(newTimespan);
      mediumData.setTimespan(newTimespan);
      largeData.setTimespan(newTimespan);
    }
  };

  // Process data for multi-line chart
  const chartData = useMemo(() => {
    // Collect all unique periods from all data sources
    const allPeriods = new Set<string>();

    // Add periods from small data
    if (smallData.bidAverageData?.periods) {
      smallData.bidAverageData.periods.forEach((item) => {
        allPeriods.add(item.period);
      });
    }

    // Add periods from medium data
    if (mediumData.bidAverageData?.periods) {
      mediumData.bidAverageData.periods.forEach((item) => {
        allPeriods.add(item.period);
      });
    }

    // Add periods from large data
    if (largeData.bidAverageData?.periods) {
      largeData.bidAverageData.periods.forEach((item) => {
        allPeriods.add(item.period);
      });
    }

    // Convert to sorted array
    const sortedPeriods = Array.from(allPeriods).sort();

    // Create maps for quick lookup of data by period
    const smallDataMap = new Map();
    const mediumDataMap = new Map();
    const largeDataMap = new Map();

    if (smallData.bidAverageData?.periods) {
      smallData.bidAverageData.periods.forEach((item) => {
        smallDataMap.set(item.period, {
          value: parseFloat(item.parsedAverageBid),
          formatted: formatRoundedEth(item.parsedAverageBid, 5),
        });
      });
    }

    if (mediumData.bidAverageData?.periods) {
      mediumData.bidAverageData.periods.forEach((item) => {
        mediumDataMap.set(item.period, {
          value: parseFloat(item.parsedAverageBid),
          formatted: formatRoundedEth(item.parsedAverageBid, 5),
        });
      });
    }

    if (largeData.bidAverageData?.periods) {
      largeData.bidAverageData.periods.forEach((item) => {
        largeDataMap.set(item.period, {
          value: parseFloat(item.parsedAverageBid),
          formatted: formatRoundedEth(item.parsedAverageBid, 5),
        });
      });
    }

    // Helper function to interpolate missing values
    const interpolateValue = (
      prevValue: number | null,
      nextValue: number | null,
      fallbackValue: number = 0
    ) => {
      if (prevValue !== null && nextValue !== null) {
        return (prevValue + nextValue) / 2;
      }
      if (prevValue !== null) return prevValue;
      if (nextValue !== null) return nextValue;
      return fallbackValue;
    };

    // Helper function to find nearest values for interpolation
    const findNearestValues = (
      dataMap: Map<string, { value: number; formatted: string }>,
      periods: string[],
      currentIndex: number
    ) => {
      let prevValue = null;
      let nextValue = null;

      // Look backwards for previous value
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (dataMap.has(periods[i])) {
          prevValue = dataMap.get(periods[i])!.value;
          break;
        }
      }

      // Look forwards for next value
      for (let i = currentIndex + 1; i < periods.length; i++) {
        if (dataMap.has(periods[i])) {
          nextValue = dataMap.get(periods[i])!.value;
          break;
        }
      }

      return { prevValue, nextValue };
    };

    // Build complete dataset with interpolated values
    const completeData = sortedPeriods.map((period, index) => {
      const chartPoint: {
        date: string;
        small: number;
        medium: number;
        large: number;
        formattedSmall: string;
        formattedMedium: string;
        formattedLarge: string;
      } = {
        date: period,
        small: 0,
        medium: 0,
        large: 0,
        formattedSmall: '',
        formattedMedium: '',
        formattedLarge: '',
      };

      // Handle small data
      if (smallDataMap.has(period)) {
        const data = smallDataMap.get(period)!;
        chartPoint.small = data.value;
        chartPoint.formattedSmall = data.formatted;
      } else {
        const { prevValue, nextValue } = findNearestValues(
          smallDataMap,
          sortedPeriods,
          index
        );
        const interpolatedValue = interpolateValue(prevValue, nextValue);
        chartPoint.small = interpolatedValue;
        chartPoint.formattedSmall = formatRoundedEth(interpolatedValue, 5);
      }

      // Handle medium data
      if (mediumDataMap.has(period)) {
        const data = mediumDataMap.get(period)!;
        chartPoint.medium = data.value;
        chartPoint.formattedMedium = data.formatted;
      } else {
        const { prevValue, nextValue } = findNearestValues(
          mediumDataMap,
          sortedPeriods,
          index
        );
        const interpolatedValue = interpolateValue(prevValue, nextValue);
        chartPoint.medium = interpolatedValue;
        chartPoint.formattedMedium = formatRoundedEth(interpolatedValue, 5);
      }

      // Handle large data
      if (largeDataMap.has(period)) {
        const data = largeDataMap.get(period)!;
        chartPoint.large = data.value;
        chartPoint.formattedLarge = data.formatted;
      } else {
        const { prevValue, nextValue } = findNearestValues(
          largeDataMap,
          sortedPeriods,
          index
        );
        const interpolatedValue = interpolateValue(prevValue, nextValue);
        chartPoint.large = interpolatedValue;
        chartPoint.formattedLarge = formatRoundedEth(interpolatedValue, 5);
      }

      return chartPoint;
    });

    return completeData;
  }, [
    smallData.bidAverageData,
    mediumData.bidAverageData,
    largeData.bidAverageData,
  ]);

  // Get summary statistics for each size
  const getSummaryStats = () => {
    return {
      small: {
        value: smallData.bidAverageData?.global
          ? formatRoundedEth(
              smallData.bidAverageData.global.parsedAverageBid,
              3
            )
          : '0.000',
      },
      medium: {
        value: mediumData.bidAverageData?.global
          ? formatRoundedEth(
              mediumData.bidAverageData.global.parsedAverageBid,
              3
            )
          : '0.000',
      },
      large: {
        value: largeData.bidAverageData?.global
          ? formatRoundedEth(
              largeData.bidAverageData.global.parsedAverageBid,
              3
            )
          : '0.000',
      },
    };
  };

  const summaryStats = getSummaryStats();

  // Format X-axis ticks based on timespan
  const formatXAxisTick = (value: string) => {
    if (!value) return '';

    switch (timespan) {
      case 'D':
        // For day, show the day part (e.g., "06" from "2025-05-06")
        return value.split('-')[2] || value;
      case 'W':
        // For week, show the week part (e.g., "17" from "2025-17")
        return value.split('-')[1] || value;
      case 'M':
        // For month, show the month part (e.g., "04" from "2025-04")
        return value.split('-')[1] || value;
      case 'Y':
        // For year, show the year (e.g., "2025")
        return value.split('-')[0] || value;
      default:
        return value;
    }
  };

  // Format tooltip header based on timespan
  const formatTooltipHeader = (label: string) => {
    if (!label) return '';

    switch (timespan) {
      case 'D':
        // For day, show the full date (e.g., "May 6, 2025")
        const parts = label.split('-');
        if (parts.length === 3) {
          return `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
        return label;
      case 'W':
        // For week, show "Week X, Year"
        const weekParts = label.split('-');
        if (weekParts.length === 2) {
          return `Week ${weekParts[1]}, ${weekParts[0]}`;
        }
        return label;
      case 'M':
        // For month, show "Month, Year"
        const monthParts = label.split('-');
        if (monthParts.length === 2) {
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          const monthIndex = parseInt(monthParts[1], 10) - 1;
          const monthName = monthNames[monthIndex] || monthParts[1];
          return `${monthName}, ${monthParts[0]}`;
        }
        return label;
      case 'Y':
        // For year, show the year
        return label;
      default:
        return label;
    }
  };

  // Custom styles
  const customStyles = {
    card: {
      backgroundColor: '#1A1919',
      border: 'none',
    },
    title: {
      color: '#FFFFFF',
    },
    description: {
      color: '#B1B1B1',
    },
    sizeCard: {
      backgroundColor: '#252525',
      border: '1px solid #2C2E30',
      borderRadius: '8px',
    },
    sizeLabel: {
      color: '#B1B1B1',
      fontSize: '14px',
    },
    bidValue: {
      color: '#FFFFFF',
      fontSize: '20px',
      fontWeight: 'bold',
    },
    percentageChange: {
      color: '#10B981',
      fontSize: '12px',
      fontWeight: '500',
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

    const formattedLabel = formatTooltipHeader(label);

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
          {formattedLabel}
        </p>
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            style={{
              color: entry.color,
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '3px',
            }}
          >
            <span style={{ marginRight: '8px' }}>
              {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}:
            </span>
            <span style={{ fontWeight: 'bold' }}>
              {formatRoundedEth(entry.value as number, 5)} ETH
            </span>
          </div>
        ))}
      </div>
    );
  };

  const isLoading =
    smallData.isLoading || mediumData.isLoading || largeData.isLoading;

  const hasError = smallData.error || mediumData.error || largeData.error;

  return (
    <Card
      className='@container/card flex flex-col h-full'
      style={{ ...customStyles.card, borderRadius: '12px' }}
    >
      <CardHeader className='relative'>
        <div className='flex flex-col gap-1'>
          <CardTitle className='text-2xl font-bold' style={customStyles.title}>
            Average Bid (ETH)
          </CardTitle>
          <CardDescription
            className='text-base'
            style={customStyles.description}
          >
            Average bid in ETH recorded during the period by contract size
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

      {/* Summary cards */}
      <div className='px-6 mb-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {contractSizeOptions.map((option) => {
            const stats =
              summaryStats[option.value as keyof typeof summaryStats];
            const sizeKey = option.value as ContractSize;
            const isHovered = hoveredSize === sizeKey;
            const isAnyHovered = hoveredSize !== null;

            // Get the color for this size from chartConfig
            const lineColor = chartConfig[sizeKey].color;

            return (
              <div
                key={option.value}
                style={{
                  ...customStyles.sizeCard,
                  opacity: isAnyHovered && !isHovered ? 0.5 : 1,
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease-in-out',
                }}
                className='p-3 text-center cursor-pointer'
                onMouseEnter={() => setHoveredSize(sizeKey)}
                onMouseLeave={() => setHoveredSize(null)}
              >
                <div
                  style={{
                    ...customStyles.sizeLabel,
                    color: lineColor,
                    fontWeight: '600',
                  }}
                  className='mb-2'
                >
                  {option.label}
                </div>
                <div style={customStyles.bidValue} className='mb-1'>
                  {isLoading || !currentBlockchainId ? (
                    <Skeleton className='h-5 w-20 bg-slate-700 mx-auto' />
                  ) : (
                    `${stats.value} ETH`
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CardContent className='px-2 pt-0 sm:px-6 flex-1 flex flex-col'>
        {isLoading || !currentBlockchainId ? (
          <div className='aspect-auto min-h-[200px] flex-1 w-full flex items-center justify-center'>
            <Skeleton className='h-[200px] w-full bg-slate-700' />
          </div>
        ) : hasError ? (
          <div className='aspect-auto h-[250px] w-full flex items-center justify-center text-center text-red-500'>
            Error loading chart data. Please try again.
          </div>
        ) : chartData.length === 0 ? (
          <div className='aspect-auto min-h-[200px] flex-1 w-full flex items-center justify-center text-center text-gray-400'>
            No data available for the selected filters.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto min-h-[200px] flex-1 w-full'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id='fillSmall' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#3B82F6' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#3B82F6' stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id='fillMedium' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#10B981' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#10B981' stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id='fillLarge' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#F59E0B' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#F59E0B' stopOpacity={0.1} />
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
                  tickFormatter={formatXAxisTick}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: customStyles.yAxis.color }}
                  tickFormatter={(value) => `${formatETHForAxis(value)} ETH`}
                  width={80}
                />
                <Tooltip cursor={false} content={<CustomTooltip />} />
                {(hoveredSize === null || hoveredSize === 'small') && (
                  <Area
                    dataKey='small'
                    type='monotone'
                    fill='url(#fillSmall)'
                    stroke='#3B82F6'
                    strokeWidth={hoveredSize === 'small' ? 3 : 2}
                  />
                )}
                {(hoveredSize === null || hoveredSize === 'medium') && (
                  <Area
                    dataKey='medium'
                    type='monotone'
                    fill='url(#fillMedium)'
                    stroke='#10B981'
                    strokeWidth={hoveredSize === 'medium' ? 3 : 2}
                  />
                )}
                {(hoveredSize === null || hoveredSize === 'large') && (
                  <Area
                    dataKey='large'
                    type='monotone'
                    fill='url(#fillLarge)'
                    stroke='#F59E0B'
                    strokeWidth={hoveredSize === 'large' ? 3 : 2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
