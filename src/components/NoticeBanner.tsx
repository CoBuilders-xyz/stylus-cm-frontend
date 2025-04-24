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
    <div className='rounded-md overflow-hidden bg-black'>
      <div className='text-center flex flex-col items-center justify-center mb-2'>
        <Image src={image} alt={title} width={200} height={200} />
        <h2 className='text-2xl font-semibold text-white mb-2'>{title}</h2>
        <p className='text-gray-300 max-w-md'>{description}</p>
      </div>
    </div>
  );
}
