'use client';

import { revalidateByPageTag, revalidateByPath, revalidateDateTag, revalidateLoremParams, revalidateLoremSeconds } from '@/app/isr/[id]/actions';
import { Button } from '@repo/ui/components/ui/button';
import { useRouter } from 'next/navigation';

export function RevalidateButtons({ isrId, seconds }: { isrId: string, seconds: number }) {
  const router = useRouter();

  const handleRevalidate = async (action: () => Promise<void>) => {
    await action();
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => handleRevalidate(() => revalidateByPath(isrId))}
      >
        Revalidate Page By Path <span className="text-amber-500">[/isr/{isrId}]</span>
      </Button>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => handleRevalidate(() => revalidateByPageTag(isrId))}
      >
        Revalidate Page By Tag <span className="text-sky-500">[isr-page-{isrId}]</span>
      </Button>

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => handleRevalidate(() => revalidateDateTag())}
      >
        Revalidate Fetch Date Tag <span className="text-purple-500">[isr-date-fetch]</span>
      </Button>

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => handleRevalidate(() => revalidateLoremParams(isrId))}
      >
        Revalidate Fetch Lorem Params <span className="text-green-500">[isr-lorem-{isrId}]</span>
      </Button>

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => handleRevalidate(() => revalidateLoremSeconds(seconds))}
      >
        Revalidate Fetch Lorem Seconds <span className="text-green-500">[isr-lorem-{seconds}]</span>
      </Button>
    </div>
  );
}

