import ContractsTable from '@/components/ContractsTable';

export default function ExploreContractsPage() {
  return (
    <div
      className='p-10'
      style={{
        background: 'black',
      }}
    >
      <ContractsTable contracts={[]} viewType='explore-contracts' />
    </div>
  );
}
