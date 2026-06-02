import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className='py-3 bg-transparent'>
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
