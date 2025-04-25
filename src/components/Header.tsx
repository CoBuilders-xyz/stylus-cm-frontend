import Link from 'next/link';
import Image from 'next/image';
import logo from 'public/logo.svg';
import { Megaphone } from 'lucide-react';

// import BlockchainSelector from './BlockchainSelector';
import ConnectWallet from './ConnectWallet';
export default function Header() {
  return (
    <div className='w-full bg-black text-white z-10 flex flex-wrap items-center justify-between p-4 px-10 fixed'>
      <div className='space-x-4 text-xs flex items-center'>
        <span className='flex items-center'>
          <Link href='/'>
            <Image src={logo} alt='logo' className='mr-2' />
          </Link>
        </span>
        <Link href='/cache-status'>Cache Status</Link>
        <Link href='/explore-contracts'>Explore Contracts</Link>
        <Link href='/my-contracts'>My Contracts</Link>
      </div>
      <div className='space-x-4 text-xs flex items-center'>
        <div
          className='border border-white rounded-[10px] p-2 flex items-center justify-center'
          style={{ borderWidth: '1px' }}
        >
          <Megaphone className='w-4 h-4' />
        </div>
        {/* <BlockchainSelector /> */}
        <ConnectWallet />
      </div>
    </div>
  );
}
