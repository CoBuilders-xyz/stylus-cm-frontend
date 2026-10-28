import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className='py-4 bg-page border-t border-hairline'>
      <div className='container mx-auto px-4 text-center'>
        <p className='text-xs text-ink-3'>
          Built by{' '}
          <a
            href='https://www.cobuilders.xyz/'
            target='_blank'
            rel='noopener noreferrer'
            className='text-ink-2 font-medium hover:text-ink-1 transition-colors duration-200'
          >
            CoBuilders.xyz
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
