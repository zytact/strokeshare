'use client';

import { ModeToggle } from '@/components/ui/mode-toggle';
import dynamic from 'next/dynamic';

const DynamicInfiniteCanvas = dynamic(
    () => import('@/components/ui/InfiniteCanvas'),
    {
        ssr: false,
    },
);

export default function HomePage() {
    return (
        <main className="relative h-screen w-screen overflow-hidden">
            <div className="absolute right-4 top-4 z-10">
                <ModeToggle />
            </div>
            <DynamicInfiniteCanvas />
        </main>
    );
}
