'use client';

import React from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
  Rectangle,
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
import {
  useCacheManagerActivity,
  CacheManagerActivityTimespan,
} from '@/hooks/useCacheManagerActivity';
import { Skeleton } from '@/components/ui/skeleton';

// Chart configuration
const chartConfig = {
  insertCount: {
    label: 'Insertions Count',
    color: 'var(--series-1)',
  },
  deleteCount: {
    label: 'Deletions Count',
    color: 'var(--series-2)',
  },
} satisfies ChartConfig;

// Available timespan options
const timespanOptions = [
  { value: 'D', label: 'D' },
  { value: 'W', label: 'W' },
  { value: 'M', label: 'M' },
  { value: 'Y', label: 'Y' },
];

// Custom cursor component for the tooltip
interface CustomCursorProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const CustomCursor = (props: CustomCursorProps) => {
  const { x, y, width, height } = props;

  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill='var(--surface-3)'
      fillOpacity={0.3}
      stroke='none'
    />
  );
};

export default function CacheManagerActivity() {
  // Use the cache manager activity hook
  const {
    activityData,
    totalInserts,
    totalDeletes,
    isLoading,
    error,
    timespan,
    setTimespan,
    currentBlockchainId,
  } = useCacheManagerActivity('M');

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
        return value;
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
    globalValue: {
      color: 'var(--ink-1)',
    },
    description: {
      color: 'var(--ink-3)',
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
    const data = payload[0]?.payload;

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
          style={{ color: 'var(--ink-1)', marginBottom: '8px', fontWeight: 'bold' }}
        >
          {formattedLabel}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              color: 'var(--series-1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '12px' }}>Insertions:</span>
            <span style={{ fontWeight: 'bold' }}>{data?.insertCount || 0}</span>
          </div>
          <div
            style={{
              color: 'var(--series-2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '12px' }}>Deletions:</span>
            <span style={{ fontWeight: 'bold' }}>{data?.deleteCount || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  // Handle timespan change
  const handleTimespanChange = (value: string) => {
    if (value) {
      setTimespan(value as CacheManagerActivityTimespan);
    }
  };

  return (
    <Card
      className='@container/card flex flex-col h-full'
      style={{ ...customStyles.card, borderRadius: '10px' }}
    >
      {/* Header - flex: 3 (30%) */}
      <div className='flex flex-col flex-[3] min-h-0'>
        <CardHeader className='relative pb-1 sm:pb-2 flex-1'>
          <div className='flex flex-col gap-1 sm:gap-2 pr-20 h-full'>
            <CardTitle
              className='text-[13.5px] font-semibold'
              style={customStyles.title}
            >
              Bid Placement Activity
            </CardTitle>
            <CardDescription
              className='text-xs'
              style={customStyles.description}
            >
              Bid placement and deletion activity for the selected period
            </CardDescription>
            <div className='flex flex-col gap-1 flex-1 justify-center'>
              <div
                className='text-sm sm:text-2xl font-bold'
                style={customStyles.globalValue}
              >
                {isLoading || !currentBlockchainId ? (
                  <Skeleton className='h-4 sm:h-8 w-32 bg-surface-3' />
                ) : (
                  <div className='flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs sm:text-sm'>
                    <div className='flex items-center'>
                      <span
                        className='mr-1 pb-1'
                        style={{
                          color: 'var(--series-1)',
                          fontSize: '12px sm:24px',
                          lineHeight: '1',
                          display: 'inline-block',
                          verticalAlign: 'middle',
                        }}
                      >
                        ●
                      </span>
                      Insertions: {totalInserts}
                    </div>
                    <div className='flex items-center'>
                      <span
                        className='mr-1 pb-1'
                        style={{
                          color: 'var(--series-2)',
                          fontSize: '12px sm:24px',
                          lineHeight: '1',
                          display: 'inline-block',
                          verticalAlign: 'middle',
                        }}
                      >
                        ●
                      </span>
                      Deletions: {totalDeletes}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
      </div>

      {/* Chart Container - flex: 7 (70%) */}
      <CardContent className='flex-[7] flex flex-col p-1 sm:p-2 min-h-0'>
        {isLoading || !currentBlockchainId ? (
          <div className='flex-1 w-full flex items-center justify-center'>
            <Skeleton className='h-full w-full bg-surface-3' />
          </div>
        ) : error ? (
          <div className='flex-1 w-full flex items-center justify-center text-center text-red-500'>
            Error loading chart data. Please try again.
          </div>
        ) : activityData.length === 0 ? (
          <div className='flex-1 w-full flex items-center justify-center text-center text-ink-3'>
            No data available for the selected filters.
          </div>
        ) : (
          <div className='flex-1 w-full p-1 min-h-0'>
            <ChartContainer config={chartConfig} className='w-full h-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart
                  data={activityData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 40 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray='3 3'
                    stroke={customStyles.grid.stroke}
                  />
                  <XAxis
                    dataKey='period'
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
                    width={30}
                  />
                  <Tooltip
                    cursor={<CustomCursor />}
                    content={<CustomTooltip />}
                  />
                  <Line
                    type='natural'
                    dataKey='insertCount'
                    name='Insert Count'
                    stroke='var(--series-1)'
                    fill='var(--series-1)'
                    strokeWidth={2}
                    dot={true}
                  />
                  <Line
                    type='natural'
                    dataKey='deleteCount'
                    name='Eviction Count'
                    stroke='var(--series-2)'
                    fill='var(--series-2)'
                    strokeWidth={2}
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
