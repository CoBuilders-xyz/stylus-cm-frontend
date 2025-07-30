import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className='py-4 mt-auto'>
      <div className='container mx-auto px-4 text-center'>
        <p className='text-sm text-gray-600'>
          Developed by{' '}
          <a
            href='https://www.cobuilders.xyz/'
            target='_blank'
            rel='noopener noreferrer'
            className='text-blue-600 hover:text-blue-800 transition-colors duration-200'
          >
            CoBuilders.xyz
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
