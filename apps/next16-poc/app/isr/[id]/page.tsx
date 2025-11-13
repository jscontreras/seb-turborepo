import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { RevalidateButtons } from '@/components/revalidate-buttons';
import { getLoremData } from './actions';

// Next.js will invalidate the cache when a
// request comes in, at most once every 100 seconds.

const dateFormat: Intl.DateTimeFormatOptions = {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
};

const RenderTags = ({cacheTags}: {cacheTags: string[]}) => {
  return <span className="text-pink-300 text-sm lowercase"> {`[ ${cacheTags.join(', ')} ]`}</span>;
}

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

  const res = await getLoremData(int_id);
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

  // Split time string to extract seconds for styling
  const timeParts = currentTime.match(/^(.+):(\d{2})\s+(AM|PM)$/);
  const timeWithColoredSeconds = timeParts
    ? (
        <span className="text-xl">
          {timeParts[1]}:<span className="text-green-400">{timeParts[2]}</span> {timeParts[3]}
        </span>
      )
    : currentTime;

  const loremSeconds = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${seconds}`,
    {
      next: { tags: [`isr-lorem-${seconds}`] },
      cache: 'force-cache',
    },
  );
  const loremSecondsData = (await loremSeconds.json()) as { title: string; body: string };

  const data = res as { title: string; body: string };

  return (

    // Create bottoms panel
    <div className="grid grid-cols-6 gap-x-6 gap-y-3">
      <div className="col-span-full space-y-3 lg:col-span-4">
        <h1 className="text-2xl font-medium capitalize text-gray-200">ISR Page with slug param <span className="text-sky-500">[{id}]</span>
        <RenderTags cacheTags={[`isr-page-${id}`]} /></h1>
        <hr></hr>
        <h1 className=" pt-4 truncate text-xl font-medium capitalize text-gray-200">
          <span className="text-xl text-sky-500">[Lorem Post ID: {int_id}]</span> {data.title} <RenderTags cacheTags={[`isr-lorem-${int_id}`]} /></h1>
        <p className="font-medium text-gray-500">{data.body}</p>
      </div>
      <div className="col-span-full space-y-3">
        <p className="font-medium text-white-400 text-xl">
          <span className="text-xl text-purple-400">[External Server Time]</span>  {timeWithColoredSeconds} <RenderTags cacheTags={[`isr-date-fetch`]} />
        </p>
        <h1 className="truncate text-xl font-medium capitalize text-gray-200">
          <span className="tect-2xl text-green-500">[Lorem Post ID: {seconds}]</span> {loremSecondsData.title} <RenderTags cacheTags={[`isr-lorem-${seconds}`]} /></h1>
        <p className="font-medium text-gray-500">{loremSecondsData.body}</p>
        <p className="font-medium text-amber-200 text-xl">
          Function based Date: {new Date().toLocaleString('en-US', dateFormat)}
        </p>
      </div>
      <div className="mt-4 col-span-full lg:order-none lg:col-span-11 p-8 border border-border rounded-lg">
        <RevalidateButtons isrId={id} seconds={seconds} />
      </div>
    </div>
  );
}

