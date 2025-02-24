import { ModeToggle } from '@/components/ui/mode-toggle';
import InfiniteCanvas from '@/components/ui/InfiniteCanvas';
import { Help } from '@/components/ui/Help';

export default function HomePage() {
    return (
        <main className="relative h-screen w-screen overflow-hidden">
            <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
                <ModeToggle />
                <div className="block sm:hidden">
                    <Help />
                </div>
            </div>
            <InfiniteCanvas />
        </main>
    );
}
