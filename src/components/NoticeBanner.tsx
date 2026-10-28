import Image from 'next/image';

export default function NoticeBanner({
  image,
  title,
  description,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  image: any;
  title: string;
  description: string;
}) {
  return (
    <div className='rounded-[10px] overflow-hidden bg-surface-1 border border-hairline'>
      <div className='text-center flex flex-col items-center justify-center mb-2'>
        <Image src={image} alt={title} width={200} height={200} />
        <h2 className='text-[15px] font-semibold text-ink-1 mb-2'>{title}</h2>
        <p className='text-[12.5px] text-ink-2 max-w-md'>{description}</p>
      </div>
    </div>
  );
}
