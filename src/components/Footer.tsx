import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className='fixed bottom-1 left-0 right-0 z-10 bg-transparent mb-1'>
      <div className='container mx-auto px-4 text-center'>
        <p className='text-sm text-gray-300'>
          Built by{' '}
          <a
            href='https://www.cobuilders.xyz/'
            target='_blank'
            rel='noopener noreferrer'
            className='text-gray-100 font-bold hover:text-gray-500 transition-colors duration-200'
          >
            CoBuilders.xyz
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
