'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Contract {
  id: string;
  address: string;
  bid: string;
  effectiveBid: string;
  size: string;
  minBid: string;
  evictionRisk: 'High' | 'Medium' | 'Low' | '-';
  totalSpent: string;
  cacheStatus: {
    status: 'Cached' | 'Not Cached';
    timestamp: string;
  };
}

interface ContractsTableProps {
  contracts: Contract[];
  viewType?: 'explore-contracts' | 'my-contracts';
}

export default function ContractsTable({
  contracts,
  viewType = 'explore-contracts',
}: ContractsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Sample data that matches the wireframe image
  const sampleContracts: Contract[] = [
    {
      id: '1',
      address: '0xF5A7B8C9...567890',
      bid: '0.05 ETH',
      effectiveBid: '0.05 ETH',
      size: '12.4 KB',
      minBid: '0.05 ETH',
      evictionRisk: 'High',
      totalSpent: '0.9 ETH',
      cacheStatus: {
        status: 'Cached',
        timestamp: '2024-02-04 14:30',
      },
    },
    {
      id: '2',
      address: '0xC00ME1F2...012345',
      bid: '0.05 ETH',
      effectiveBid: '0.0 ETH',
      size: '13.2 KB',
      minBid: '0.05 ETH',
      evictionRisk: '-',
      totalSpent: '0.00 ETH',
      cacheStatus: {
        status: 'Not Cached',
        timestamp: '2024-02-04 14:30',
      },
    },
    {
      id: '3',
      address: '0xB9C00E1...890123',
      bid: '0.05 ETH',
      effectiveBid: '0.05 ETH',
      size: '9.5 KB',
      minBid: '0.05 ETH',
      evictionRisk: 'Low',
      totalSpent: '0.0 ETH',
      cacheStatus: {
        status: 'Cached',
        timestamp: '2024-02-04 14:30',
      },
    },
    {
      id: '4',
      address: '0xA7B8C900...789012',
      bid: '0.05 ETH',
      effectiveBid: '0.05 ETH',
      size: '8.1 KB',
      minBid: '0.05 ETH',
      evictionRisk: 'Medium',
      totalSpent: '0.0 ETH',
      cacheStatus: {
        status: 'Cached',
        timestamp: '2024-02-04 14:30',
      },
    },
    {
      id: '5',
      address: '0xD0E1F2A3...234567',
      bid: '0.05 ETH',
      effectiveBid: '0.0 ETH',
      size: '10.0 KB',
      minBid: '0.05 ETH',
      evictionRisk: '-',
      totalSpent: '0.00 ETH',
      cacheStatus: {
        status: 'Not Cached',
        timestamp: '2024-02-04 14:30',
      },
    },
  ];

  // Use provided contracts or fallback to sample data
  const displayContracts = contracts?.length ? contracts : sampleContracts;

  // Calculate total pages
  const totalPages = Math.ceil(displayContracts.length / itemsPerPage);

  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayContracts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Handle page changes
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getEvictionRiskColor = (risk: string) => {
    switch (risk) {
      case 'High':
        return 'text-red-500';
      case 'Medium':
        return 'text-yellow-500';
      case 'Low':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className='overflow-hidden'>
      <div className='flex justify-between mb-8'>
        <h1 className='text-xl font-bold text-white'>
          {viewType === 'my-contracts' ? 'My Contracts' : 'Explore Contracts'}
        </h1>
        <div className='relative'>
          <input
            type='text'
            placeholder='Search contracts...'
            className='m-1 p-2 pl-10 bg-black rounded-md w-60 border border-gray-500 focus:outline-none focus:border-white'
          />
          <button className='absolute left-1 p-3'>🔍</button>
        </div>
      </div>
      <div className='overflow-hidden'>
        <Table className='w-full'>
          <TableHeader className='bg-black text-white'>
            <TableRow className='!border-0 h-20 hover:bg-transparent'>
              <TableHead className='font-medium text-base py-6'>
                Contract
              </TableHead>
              <TableHead className='font-medium text-base py-6'>Bid</TableHead>
              <TableHead className='font-medium text-base py-6'>
                Effective Bid
              </TableHead>
              <TableHead className='font-medium text-base py-6'>Size</TableHead>
              <TableHead className='font-medium text-base py-6'>
                Min. Bid
              </TableHead>
              <TableHead className='font-medium text-base py-6'>
                Eviction Risk
              </TableHead>
              <TableHead className='font-medium text-base py-6'>
                Total Spent
              </TableHead>
              <TableHead className='font-medium text-base py-6'>
                Cache Status
              </TableHead>
              <TableHead className='font-medium text-base py-6'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='text-white [&>tr]:py-2'>
            {currentItems.map((contract, index) => (
              <TableRow
                key={contract.id}
                className={`!border-0 h-20 ${index > 0 ? 'mt-3' : ''}`}
              >
                <TableCell className='py-6 text-lg'>
                  {contract.address}
                </TableCell>
                <TableCell className='py-6 text-lg'>{contract.bid}</TableCell>
                <TableCell className='py-6 text-lg'>
                  {contract.effectiveBid}
                </TableCell>
                <TableCell className='py-6 text-lg'>{contract.size}</TableCell>
                <TableCell className='py-6 text-lg'>
                  {contract.minBid}
                </TableCell>
                <TableCell
                  className={`${getEvictionRiskColor(
                    contract.evictionRisk
                  )} py-6 text-lg`}
                >
                  {contract.evictionRisk}
                </TableCell>
                <TableCell className='py-6 text-lg'>
                  {contract.totalSpent}
                </TableCell>
                <TableCell className='py-6'>
                  <div className='flex flex-col'>
                    <span className='text-lg'>
                      {contract.cacheStatus.status}
                    </span>
                    <span className='text-sm text-gray-400 mt-1'>
                      {contract.cacheStatus.timestamp}
                    </span>
                  </div>
                </TableCell>
                <TableCell className='py-6'>
                  <button className='w-10 h-10 flex items-center justify-center bg-black text-white border border-white rounded-md'>
                    +
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className='flex items-center justify-between mt-4 text-sm text-white'>
        <div className='flex items-center space-x-2'>
          <span>Show</span>
          <select
            className='bg-black text-white rounded-md px-2 py-1'
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value='5'>5</option>
            <option value='10'>10</option>
            <option value='25'>25</option>
            <option value='50'>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className='flex items-center space-x-2'>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className='flex space-x-1'>
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              First
            </button>
            <button
              onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              ◀
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  Math.abs(page - currentPage) < 3 ||
                  page === 1 ||
                  page === totalPages
              )
              .map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className='px-2 py-1'>...</span>
                  )}
                  <button
                    onClick={() => goToPage(page)}
                    className={`px-2 py-1 rounded-md ${
                      currentPage === page
                        ? 'bg-[#116AAE] text-white'
                        : 'bg-black text-white'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() =>
                currentPage < totalPages && goToPage(currentPage + 1)
              }
              disabled={currentPage === totalPages}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              ▶
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className='px-2 py-1 bg-black text-white rounded-md disabled:opacity-50'
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
