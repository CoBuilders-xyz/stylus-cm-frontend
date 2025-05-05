import ContractsTable from '@/components/ContractsTable';

export default function MyContractsPage() {
  return (
    <div
      className='p-10'
      style={{
        background: 'black',
      }}
    >
      <ContractsTable contracts={[]} viewType='my-contracts' />
    </div>
  );
}
