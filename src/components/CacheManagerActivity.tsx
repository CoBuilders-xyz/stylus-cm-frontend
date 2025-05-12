'use client';

import React from 'react';
import {
  Bar,
  BarChart,
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
  activityCount: {
    label: 'Activity Count',
    color: '#4267B2', // Using a blue color similar to the bid chart
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
      fill='#2C2E30'
      fillOpacity={0.3}
      stroke='none'
    />
  );
};

export default function CacheManagerActivity() {
  // Use the cache manager activity hook
  const { activityData, totalActivity, isLoading, timespan, setTimespan } =
    useCacheManagerActivity('D');

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
        <div
          style={{
            color: '#B1B1B1',
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '3px',
          }}
        >
          <span style={{ marginRight: '8px' }}>Activity Count:</span>
          <span style={{ fontWeight: 'bold' }}>{payload[0]?.value}</span>
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
      className='@container/card'
      style={{ ...customStyles.card, borderRadius: '12px' }}
    >
      <CardHeader className='relative'>
        <div className='flex flex-col gap-1'>
          <CardTitle className='text-2xl font-bold' style={customStyles.title}>
            Cache Manager Activity
          </CardTitle>
          <div className='text-4xl font-bold' style={customStyles.globalValue}>
            {isLoading ? (
              <Skeleton className='h-10 w-32 bg-slate-700' />
            ) : (
              totalActivity
            )}
          </div>
          <CardDescription
            className='text-base'
            style={customStyles.description}
          >
            Total transactions recorded for the selected period
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

      {/* Empty placeholder div to match the height of the size selector in CacheAverageBid */}
      <div className='px-6 mb-4 h-10'></div>

      <CardContent className='px-2 pt-0 sm:px-6'>
        {isLoading ? (
          <div className='aspect-auto h-[250px] w-full flex items-center justify-center'>
            <Skeleton className='h-[200px] w-full bg-slate-700' />
          </div>
        ) : activityData.length === 0 ? (
          <div className='aspect-auto h-[250px] w-full flex items-center justify-center text-center text-gray-400'>
            No data available for the selected filters.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[250px] w-full'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={activityData}>
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
                  width={40}
                />
                <Tooltip
                  cursor={<CustomCursor />}
                  content={<CustomTooltip />}
                />
                <Bar
                  dataKey='count'
                  name='activityCount'
                  fill='#4267B2'
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
