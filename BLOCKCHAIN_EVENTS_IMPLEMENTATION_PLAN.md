# Blockchain Events Frontend Implementation Plan

## Overview

Create a complete frontend implementation for the blockchain events feature, following the patterns established in ContractsTable and useContractService.

## Phase 1: Service Layer Implementation

### 1.1 Create BlockchainEventsService

- **File**: `src/services/blockchainEventsService.ts`
- **Purpose**: Handle API calls to `/blockchain-events` endpoint
- **Features**:
  - Unauthenticated requests (no auth token required)
  - Support for pagination (`page`, `limit`)
  - Support for filtering (`blockchainId`, `eventType`)
  - Support for search (`search`)
  - Support for sorting (`sortBy`, `sortOrder`)
  - Proper TypeScript interfaces
  - Error handling

### 1.2 Create Hook for Service

- **File**: `src/hooks/useBlockchainEventsService.ts`
- **Purpose**: Provide easy access to BlockchainEventsService
- **Features**:
  - No authentication required (unlike useContractService)
  - Blockchain ID integration
  - Memoization for performance
  - Similar pattern to useContractService but simpler

### 1.3 Create Data Fetching Hook

- **File**: `src/hooks/useBlockchainEvents.ts`
- **Purpose**: Manage state and data fetching logic
- **Features**:
  - Loading states
  - Error handling
  - Pagination management
  - Search functionality
  - Sorting functionality
  - Auto-refresh capabilities

## Phase 2: Type Definitions

### 2.1 Create TypeScript Interfaces

- **File**: `src/types/blockchainEvents.ts`
- **Interfaces**:
  - `BlockchainEvent` - Main event interface
  - `BlockchainEventResponse` - API response structure
  - `BlockchainEventType` - Event type enum
  - `BlockchainEventSortField` - Sort field enum
  - `BlockchainEventFilters` - Filter options interface
  - `BlockchainEventsPagination` - Pagination interface

## Phase 3: Component Implementation

### 3.1 Create BlockchainEventsTable Component

- **File**: `src/components/BlockchainEventsTable.tsx`
- **Purpose**: Main table component for displaying blockchain events
- **Features**:
  - Based on ContractsTable patterns
  - Sortable columns (blockTimestamp, blockNumber)
  - Search functionality
  - Pagination controls
  - Responsive design
  - Performance optimizations (React.memo, useCallback)

### 3.2 Create Supporting Components

- **Files**: Within BlockchainEventsTable component
- **Components**:
  - `SortableTableHead` - Sortable table headers
  - `EventRow` - Individual event row component
  - `Pagination` - Pagination controls
  - `EventTypeFilter` - Filter by Insert/Delete events
  - `SearchBar` - Search input component

## Phase 4: Page Integration

### 4.1 Create Events Page

- **File**: `src/app/events/page.tsx`
- **Purpose**: Main page for blockchain events
- **Features**:
  - Page layout and styling
  - Integration with BlockchainEventsTable
  - Loading states
  - Error handling
  - SEO optimization

### 4.2 Navigation Integration

- **Files**: Navigation components
- **Updates**:
  - Add "Events" link to navigation
  - Update routing configuration
  - Add appropriate icons

## Phase 5: Styling and UX

### 5.1 Event-Specific Styling

- **Features**:
  - Event type badges (Insert/Delete)
  - Transaction hash display
  - Block number/timestamp formatting
  - Contract address truncation
  - Responsive design for mobile

### 5.2 Loading and Error States

- **Features**:
  - Loading spinners
  - Error banners
  - Empty state handling
  - Skeleton loaders

## Phase 6: Testing and Optimization

### 6.1 Testing

- **Features**:
  - Unit tests for service
  - Component testing
  - Integration testing
  - Error scenario testing

### 6.2 Performance Optimization

- **Features**:
  - Memoization optimization
  - Pagination performance
  - Search debouncing
  - Virtual scrolling (if needed)

## Implementation Details

### API Integration

- **Endpoint**: `GET /blockchain-events`
- **Parameters**:
  - `blockchainId`: UUID (required)
  - `eventType`: 'InsertBid' | 'DeleteBid' (optional)
  - `search`: string (optional)
  - `sortBy`: 'blockTimestamp' | 'blockNumber' (optional)
  - `sortOrder`: 'ASC' | 'DESC' (optional)
  - `page`: number (optional, default: 1)
  - `limit`: number (optional, default: 10)

### Response Structure

```typescript
interface BlockchainEventsResponse {
  data: BlockchainEvent[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

### Key Differences from ContractsTable

1. **No Authentication**: Events are public, no auth token needed
2. **Different Data Structure**: Events have different fields than contracts
3. **Simplified Actions**: No "add to favorites" or similar actions
4. **Read-Only**: Events are historical data, no modifications
5. **Enhanced Search**: Search matches contract addresses to find related events

## Success Criteria

- ✅ Users can view blockchain events without authentication
- ✅ Events are properly paginated and sortable
- ✅ Search functionality works with contract addresses
- ✅ Events display is responsive and performant
- ✅ Error handling is robust and user-friendly
- ✅ Integration with existing blockchain selection works
- ✅ Loading states provide good UX

## Next Steps

1. Start with Phase 1 (Service Layer)
2. Create comprehensive TypeScript interfaces
3. Implement the main table component
4. Add page integration
5. Polish UX and styling
6. Test thoroughly
