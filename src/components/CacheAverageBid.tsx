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
    color: '#3987E5', // series-1
  },
  medium: {
    label: '8-16 KB',
    color: '#D95926', // series-2
  },
  large: {
    label: '>16 KB',
    color: '#199E70', // series-3
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
  const smallData = useBidAverage('M', 'small');
  const mediumData = useBidAverage('M', 'medium');
  const largeData = useBidAverage('M', 'large');

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
      backgroundColor: 'var(--surface-1)',
      border: '1px solid var(--border-hairline)',
    },
    title: {
      color: 'var(--ink-1)',
    },
    description: {
      color: 'var(--ink-3)',
    },
    sizeCard: {
      backgroundColor: 'var(--surface-2)',
      border: '1px solid var(--border-hairline)',
      borderRadius: '8px',
    },
    sizeLabel: {
      color: 'var(--ink-3)',
      fontSize: '12px',
    },
    bidValue: {
      color: 'var(--ink-1)',
      fontSize: '16px',
      fontWeight: '650',
      fontVariantNumeric: 'tabular-nums',
    },
    percentageChange: {
      color: 'var(--ok-text)',
      fontSize: '11px',
      fontWeight: '500',
    },
    toggleButton: {
      backgroundColor: 'transparent',
      color: 'var(--ink-3)',
      border: 'none',
      borderRadius: '6px',
      margin: '0',
    },
    toggleButtonActive: {
      backgroundColor: 'var(--surface-3)',
      color: 'var(--ink-1)',
      border: 'none',
      borderRadius: '6px',
      margin: '0',
    },
    toggleGroup: {
      backgroundColor: 'var(--surface-2)',
      border: '1px solid var(--border-hairline)',
      borderRadius: '8px',
      padding: '2px',
      overflow: 'hidden',
    },
    yAxis: {
      color: 'var(--ink-3)',
    },
    xAxis: {
      color: 'var(--ink-3)',
    },
    grid: {
      stroke: 'var(--chart-grid)',
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
          backgroundColor: 'var(--surface-3)',
          border: '1px solid var(--border-strong)',
          padding: '10px',
          borderRadius: '4px',
        }}
      >
        <p
          style={{ color: 'var(--ink-1)', marginBottom: '4px', fontWeight: 'bold' }}
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
  const isEmpty =
    !isLoading &&
    Boolean(currentBlockchainId) &&
    !hasError &&
    chartData.length === 0;
  const usesStaticChartState =
    isLoading || !currentBlockchainId || Boolean(hasError) || isEmpty;

  return (
    <Card
      className='@container/card flex flex-col h-full'
      style={{ ...customStyles.card, borderRadius: '10px' }}
    >
      {/* Header and Summary Cards - flex: 3 (30%) */}
      <div
        className={`flex flex-col ${
          usesStaticChartState ? 'flex-none' : 'flex-[3] min-h-0'
        }`}
      >
        <CardHeader className='relative pb-1 sm:pb-2 flex-shrink-0'>
          <div className='flex flex-col gap-1 pr-20'>
            <CardTitle
              className='text-[13.5px] font-semibold'
              style={customStyles.title}
            >
              Average Bid (ETH)
            </CardTitle>
            <CardDescription
              className='text-xs'
              style={customStyles.description}
            >
              Average bid in ETH recorded during the period by contract size
            </CardDescription>
          </div>
          <div className='absolute right-2 top-2'>
            <ToggleGroup
              type='single'
              value={timespan}
              onValueChange={handleTimespanChange}
              variant='outline'
              className='hidden xl:flex'
              style={customStyles.toggleGroup}
            >
              {timespanOptions.map((option, index) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className='h-7 w-8 px-1.5 text-xs font-medium data-[state=on]:bg-transparent'
                  style={{
                    ...(option.value === timespan
                      ? customStyles.toggleButtonActive
                      : customStyles.toggleButton),
                    borderRight:
                      index === timespanOptions.length - 1
                        ? 'none'
                        : '1px solid var(--border-hairline)',
                    borderLeft: index === 0 ? 'none' : 'none',
                  }}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Select value={timespan} onValueChange={handleTimespanChange}>
              <SelectTrigger
                className='xl:hidden flex w-20 h-7 text-xs'
                aria-label='Select a timespan'
                style={{
                  backgroundColor: 'var(--surface-1)',
                  color: 'var(--ink-1)',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <SelectValue placeholder='D' />
              </SelectTrigger>
              <SelectContent
                className='rounded-xl'
                style={{
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                {timespanOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className='rounded-lg text-xs'
                    style={{
                      color: option.value === timespan ? 'var(--ink-1)' : 'var(--ink-3)',
                      backgroundColor:
                        option.value === timespan ? 'var(--surface-3)' : 'var(--surface-2)',
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
        <div
          className={`px-2 sm:px-6 flex items-center ${
            usesStaticChartState ? 'pb-3 sm:pb-4' : 'flex-1 min-h-0'
          }`}
        >
          <div className='grid grid-cols-3 gap-1 sm:gap-2 w-full min-h-0'>
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
                  className={`px-1 py-0.5 sm:px-2 sm:py-1 md:py-2 text-center cursor-pointer flex flex-col justify-center min-h-0 ${
                    usesStaticChartState
                      ? 'min-h-14 sm:min-h-16'
                      : 'h-full'
                  }`}
                  onMouseEnter={() => setHoveredSize(sizeKey)}
                  onMouseLeave={() => setHoveredSize(null)}
                >
                  <div
                    style={{
                      color: lineColor,
                      fontWeight: '600',
                    }}
                    className='text-[10px] sm:text-xs md:text-sm leading-tight mb-0 sm:mb-0.5'
                  >
                    {option.label}
                  </div>
                  {/* Show bid values - hide on very small heights */}
                  <div
                    className='hidden sm:block text-[8px] sm:text-xs md:text-sm leading-tight'
                    style={customStyles.bidValue}
                  >
                    {isLoading || !currentBlockchainId ? (
                      <Skeleton className='h-2 sm:h-3 md:h-4 w-8 sm:w-12 md:w-16 bg-surface-3 mx-auto' />
                    ) : (
                      <span className='block'>
                        <span>
                          {formatETHForAxis(parseFloat(stats.value))} ETH
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart Container - flex: 7 (70%) */}
      <CardContent className='flex-[7] flex flex-col p-1 sm:p-2 min-h-0'>
        {isLoading || !currentBlockchainId ? (
          <div className='flex-1 w-full flex items-center justify-center'>
            <Skeleton className='h-full w-full bg-surface-3' />
          </div>
        ) : hasError ? (
          <div className='flex-1 w-full flex items-center justify-center text-center text-red-500'>
            Error loading chart data. Please try again.
          </div>
        ) : chartData.length === 0 ? (
          <div className='flex-1 w-full flex items-center justify-center text-center text-ink-3'>
            No data available for the selected filters.
          </div>
        ) : (
          <div className='flex-1 w-full p-1 min-h-0'>
            <ChartContainer config={chartConfig} className='w-full h-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 40 }}
                >
                  <defs>
                    <linearGradient id='fillSmall' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='var(--series-1)' stopOpacity={0.12} />
                      <stop
                        offset='95%'
                        stopColor='var(--series-1)'
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                    <linearGradient id='fillMedium' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='var(--series-2)' stopOpacity={0.12} />
                      <stop
                        offset='95%'
                        stopColor='var(--series-2)'
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                    <linearGradient id='fillLarge' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='var(--series-3)' stopOpacity={0.12} />
                      <stop
                        offset='95%'
                        stopColor='var(--series-3)'
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray='0'
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
                    tickFormatter={(value) => `${formatETHForAxis(value)}`}
                    width={60}
                  />
                  <Tooltip cursor={false} content={<CustomTooltip />} />
                  {(hoveredSize === null || hoveredSize === 'small') && (
                    <Area
                      dataKey='small'
                      type='monotone'
                      fill='url(#fillSmall)'
                      stroke='var(--series-1)'
                      strokeWidth={hoveredSize === 'small' ? 3 : 2}
                    />
                  )}
                  {(hoveredSize === null || hoveredSize === 'medium') && (
                    <Area
                      dataKey='medium'
                      type='monotone'
                      fill='url(#fillMedium)'
                      stroke='var(--series-2)'
                      strokeWidth={hoveredSize === 'medium' ? 3 : 2}
                    />
                  )}
                  {(hoveredSize === null || hoveredSize === 'large') && (
                    <Area
                      dataKey='large'
                      type='monotone'
                      fill='url(#fillLarge)'
                      stroke='var(--series-3)'
                      strokeWidth={hoveredSize === 'large' ? 3 : 2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
