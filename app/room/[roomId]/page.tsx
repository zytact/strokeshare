import { Collab } from '@/components/ui/collab';
import { Help } from '@/components/ui/Help';
import { ModeToggle } from '@/components/ui/mode-toggle';

interface RoomPageProps {
    params: {
        roomId: string;
    };
}

export default function RoomPage({ params }: RoomPageProps) {
    const { roomId } = params;

    return (
        <main className="relative h-screen w-screen overflow-hidden">
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <ModeToggle />
                <div className="block sm:hidden">
                    <Help />
                </div>
                <div>
                    <Collab />
                </div>
            </div>
            <h1 className="text-2xl font-bold">{roomId}</h1>
        </main>
    );
}
