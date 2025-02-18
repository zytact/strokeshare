'use client';

import { ModeToggle } from '@/components/ui/mode-toggle';
import InfiniteCanvas from '@/components/ui/InfiniteCanvas';

export default function HomePage() {
    return (
        <main className="relative h-screen w-screen overflow-hidden">
            <div className="absolute right-4 top-4 z-10">
                <ModeToggle />
            </div>
            <InfiniteCanvas />
        </main>
    );
}
