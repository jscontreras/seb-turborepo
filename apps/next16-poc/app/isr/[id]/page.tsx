import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { RevalidateButtons } from '@/components/revalidate-buttons';

// Next.js will invalidate the cache when a
// request comes in, at most once every 100 seconds.

const dateFormat: Intl.DateTimeFormatOptions = {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
};

export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }];
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  'use cache';
  cacheLife({
    stale: 30,
    revalidate: 60,
  });

  const { id } = await params;
  const int_id = Number.parseInt(id, 10);

  cacheTag(`isr-page-${id}`);
  // Check if id is bigger than 100
  if (int_id > 100) {
    notFound();
  }
  console.log('revalidating', process.env.CUSTOM_API_KEY);

  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${int_id}`,
    {
      next: { tags: [`isr-lorem-${id}`] },
      cache: 'force-cache',
    },
  );
  const timeRes = await fetch(`https://api.tc-vercel.dev/api/time`, {
    headers: {
      'X-Custom-TC-Api-Key': process.env.CUSTOM_API_KEY || '',
    },
    cache: 'force-cache',
    next: { tags: ['isr-date-fetch'] },
  });
  const { datetime } = (await timeRes.json()) as { datetime: string };
  const dateObj = new Date(datetime);
  const currentTime = dateObj.toLocaleString('en-US', dateFormat);
  const seconds = dateObj.getSeconds();

  const loremSeconds = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${seconds}`,
    {
      next: { tags: [`isr-lorem-${seconds}`] },
      cache: 'force-cache',
    },
  );
  const loremSecondsData = (await loremSeconds.json()) as { title: string; body: string };

  const data = (await res.json()) as { title: string; body: string };

  return (

    // Create bottoms panel
    <div className="grid grid-cols-6 gap-x-6 gap-y-3">
      <div className="col-span-full space-y-3 lg:col-span-4">
        <p className="font-medium text-purple-400">
          API based Date: {currentTime}
        </p>
        <h1 className="truncate text-2xl font-medium capitalize text-gray-200">{`[${int_id}] ${data.title}`}</h1>
        <p className="font-medium text-gray-500">{data.body}</p>
      </div>
      <div className="col-span-full space-y-3">
        <h1 className="truncate text-2xl font-medium capitalize text-gray-200">{`[${seconds}] ${loremSecondsData.title}`}</h1>
        <p className="font-medium text-gray-500">{loremSecondsData.body}</p>
        <p className="font-medium text-amber-200">
          Function based Date: {new Date().toLocaleString('en-US', dateFormat)}
        </p>
      </div>
      <div className="-order-1 col-span-full lg:order-none lg:col-span-11">
        <RevalidateButtons isrId={id} seconds={seconds} />
      </div>
    </div>
  );
}
