'use client';
import { Collab } from '@/components/ui/collab';
import { Help } from '@/components/ui/Help';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { pusherClient } from '@/lib/pusher';
import { useRoomStore } from '@/store/useRoomStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import InfiniteCanvas from '@/components/ui/InfiniteCanvas';
import { throttle } from 'lodash';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const { setRoomId, setSyncing } = useRoomStore();
    const {
        setLines,
        setTextElements,
        setRectangles,
        setCircles,
        setIsRemoteUpdate,
        addToHistory,
    } = useCanvasStore();

    const latestDrawingRef = useRef<PusherDrawingData>(null);

    useEffect(() => {
        setRoomId(roomId);
    }, [roomId, setRoomId]);

    interface PusherDrawingData {
        lines?: DrawLine[];
        textElements?: TextElement[];
        rectangles?: Rectangle[];
        circles?: Circle[];
        images?: Image[];
        history?: {
            lines: DrawLine[];
            textElements: TextElement[];
            rectangles: Rectangle[];
            circles: Circle[];
            images: Image[];
        }[];
        currentStep?: number;
        isHistoryUpdate?: boolean;
    }

    useEffect(() => {
        // Create a throttled function to process drawing updates
        const processDrawingUpdate = throttle((sendDraw: PusherDrawingData) => {
            setIsRemoteUpdate(true);
            setSyncing(true);

            // If this is a history update (undo/redo), handle it differently
            if (
                sendDraw.isHistoryUpdate &&
                sendDraw.history &&
                typeof sendDraw.currentStep === 'number'
            ) {
                // Set the entire history and currentStep
                useCanvasStore.setState({
                    history: sendDraw.history,
                    currentStep: sendDraw.currentStep,
                    lines: sendDraw.lines || [],
                    textElements: sendDraw.textElements || [],
                    rectangles: sendDraw.rectangles || [],
                    circles: sendDraw.circles || [],
                    // Keep local images, don't override
                    images: useCanvasStore.getState().images,
                });
            } else {
                // Handle regular drawing updates as before
                if (sendDraw.lines) setLines(sendDraw.lines, true);
                if (sendDraw.textElements)
                    setTextElements(sendDraw.textElements, true);
                if (sendDraw.rectangles)
                    setRectangles(sendDraw.rectangles, true);
                if (sendDraw.circles) setCircles(sendDraw.circles, true);
            }

            setTimeout(() => {
                setIsRemoteUpdate(false);
                setSyncing(false);
            }, 50);
        }, 50); // 50ms throttle

        pusherClient.subscribe(roomId);
        pusherClient.bind('new-drawing', (data: PusherDrawingData) => {
            latestDrawingRef.current = data;
            processDrawingUpdate({
                lines: data.lines || [],
                textElements: data.textElements || [],
                rectangles: data.rectangles || [],
                circles: data.circles || [],
                images: data.images || [],
                history: data.history,
                currentStep: data.currentStep,
                isHistoryUpdate: !!data.isHistoryUpdate,
            });
        });

        return () => {
            pusherClient.unsubscribe(roomId);
            pusherClient.unbind('new-drawing');
        };
    }, [
        roomId,
        setLines,
        setTextElements,
        setRectangles,
        setCircles,
        setIsRemoteUpdate,
        setSyncing,
        addToHistory,
    ]);

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

            <InfiniteCanvas showImages={false} />
        </main>
    );
}
