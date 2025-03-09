'use server';

import { pusherServer } from '@/lib/pusher';

export const sendDrawing = async (
    elements: ConsolidatedState,
    roomId: string,
    history?: {
        lines: DrawLine[];
        textElements: TextElement[];
        rectangles: Rectangle[];
        circles: Circle[];
        images: Image[];
    }[],
    currentStep?: number,
) => {
    if (!elements || !roomId) {
        console.warn('Missing drawing data or room ID');
        return;
    }

    try {
        await pusherServer.trigger(roomId, 'new-drawing', {
            ...elements,
            history,
            currentStep,
            isHistoryUpdate: history !== undefined && currentStep !== undefined,
        });
    } catch (error) {
        console.error('Error sending drawing:', error);
        // Don't rethrow to prevent client-side errors
    }
};
