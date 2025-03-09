import { create } from 'zustand';
import { sendDrawing } from '@/server/actions/draw.action';
import { useRoomStore } from './useRoomStore';
import { debounce } from 'lodash';

interface CanvasState {
    lines: DrawLine[];
    textElements: TextElement[];
    rectangles: Rectangle[];
    circles: Circle[];
    images: Image[];
    isRemoteUpdate: boolean;
    history: {
        lines: DrawLine[];
        textElements: TextElement[];
        rectangles: Rectangle[];
        circles: Circle[];
        images: Image[];
    }[];
    currentStep: number;
    setLines: (lines: DrawLine[], isRemote?: boolean) => void;
    addToHistory: (
        elements:
            | DrawLine[]
            | TextElement[]
            | Rectangle[]
            | Circle[]
            | Image[]
            | ConsolidatedState,
    ) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    setTextElements: (textElements: TextElement[], isRemote?: boolean) => void;
    setRectangles: (rectangles: Rectangle[], isRemote?: boolean) => void;
    setCircles: (circles: Circle[], isRemote?: boolean) => void;
    setImages: (images: Image[], isRemote?: boolean) => void;
    setIsRemoteUpdate: (isRemote: boolean) => void;
    clear: (isRemote?: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => {
    // Create a debounced version of sendDrawing to prevent too many server calls
    const debouncedSendDrawing = debounce(
        (
            state: ConsolidatedState,
            roomId: string,
            history: {
                lines: DrawLine[];
                textElements: TextElement[];
                rectangles: Rectangle[];
                circles: Circle[];
                images: Image[];
            }[],
            currentStep: number,
        ) => {
            sendDrawing(state, roomId, history, currentStep);
        },
        100,
    ); // 100ms debounce time

    // Helper function to sync with Pusher
    const syncWithPusher = (isRemote = false) => {
        if (!isRemote && !get().isRemoteUpdate) {
            const {
                lines,
                textElements,
                rectangles,
                circles,
                history,
                currentStep,
            } = get();
            const roomId = useRoomStore.getState().roomId;
            if (roomId) {
                const consolidatedState = {
                    lines,
                    textElements,
                    rectangles,
                    circles,
                    // Exclude images from sync
                    images: [],
                };
                debouncedSendDrawing(
                    consolidatedState,
                    roomId,
                    history,
                    currentStep,
                );
            }
        }
    };

    return {
        lines: [],
        textElements: [],
        rectangles: [],
        circles: [],
        images: [],
        isRemoteUpdate: false,
        history: [
            {
                lines: [],
                textElements: [],
                rectangles: [],
                circles: [],
                images: [],
            },
        ],
        currentStep: 0,

        setIsRemoteUpdate: (isRemoteUpdate) => {
            set({ isRemoteUpdate });
        },

        setTextElements: (textElements, isRemote = false) => {
            set({ textElements });
            localStorage.setItem('texts', JSON.stringify({ textElements }));

            // Only send to Pusher if this is a local update
            if (!isRemote && !get().isRemoteUpdate) {
                const { lines, rectangles, circles } = get();
                const roomId = useRoomStore.getState().roomId;
                if (roomId) {
                    const consolidatedState = {
                        lines,
                        textElements,
                        rectangles,
                        circles,
                        // Exclude images from sync
                        images: [],
                    };
                    debouncedSendDrawing(
                        consolidatedState,
                        roomId,
                        get().history,
                        get().currentStep,
                    );
                }
            }
        },

        setLines: (lines, isRemote = false) => {
            set({ lines });
            localStorage.setItem('lines', JSON.stringify({ lines }));

            // Only send to Pusher if this is a local update
            if (!isRemote && !get().isRemoteUpdate) {
                const { textElements, rectangles, circles } = get();
                const roomId = useRoomStore.getState().roomId;
                if (roomId) {
                    const consolidatedState = {
                        lines,
                        textElements,
                        rectangles,
                        circles,
                        // Exclude images from sync
                        images: [],
                    };
                    debouncedSendDrawing(
                        consolidatedState,
                        roomId,
                        get().history,
                        get().currentStep,
                    );
                }
            }
        },

        setRectangles: (rectangles, isRemote = false) => {
            set({ rectangles });
            localStorage.setItem('rectangles', JSON.stringify({ rectangles }));

            // Only send to Pusher if this is a local update
            if (!isRemote && !get().isRemoteUpdate) {
                const { lines, textElements, circles } = get();
                const roomId = useRoomStore.getState().roomId;
                if (roomId) {
                    const consolidatedState = {
                        lines,
                        textElements,
                        rectangles,
                        circles,
                        // Exclude images from sync
                        images: [],
                    };
                    debouncedSendDrawing(
                        consolidatedState,
                        roomId,
                        get().history,
                        get().currentStep,
                    );
                }
            }
        },

        setCircles: (circles, isRemote = false) => {
            set({ circles });
            localStorage.setItem('circles', JSON.stringify({ circles }));

            // Only send to Pusher if this is a local update
            if (!isRemote && !get().isRemoteUpdate) {
                const { lines, textElements, rectangles } = get();
                const roomId = useRoomStore.getState().roomId;
                if (roomId) {
                    const consolidatedState = {
                        lines,
                        textElements,
                        rectangles,
                        circles,
                        // Exclude images from sync
                        images: [],
                    };
                    debouncedSendDrawing(
                        consolidatedState,
                        roomId,
                        get().history,
                        get().currentStep,
                    );
                }
            }
        },

        setImages: (images) => {
            set({ images });
            localStorage.setItem('images', JSON.stringify({ images }));

            // Don't sync images due to Pusher limits
            // Skip sending to Pusher for image updates
        },

        addToHistory: (
            elements:
                | DrawLine[]
                | TextElement[]
                | Rectangle[]
                | Circle[]
                | Image[]
                | ConsolidatedState,
        ) => {
            const {
                currentStep,
                history,
                lines,
                textElements,
                rectangles,
                circles,
                images,
            } = get();
            const newHistory = history.slice(0, currentStep + 1);
            if (
                typeof elements === 'object' &&
                'lines' in elements &&
                'textElements' in elements
            ) {
                const consolidatedState = elements as ConsolidatedState;
                newHistory.push({
                    lines: [...consolidatedState.lines],
                    textElements: [...consolidatedState.textElements],
                    rectangles: [...consolidatedState.rectangles],
                    circles: [...consolidatedState.circles],
                    images: [...consolidatedState.images],
                });

                set({
                    history: newHistory,
                    currentStep: currentStep + 1,
                    lines: [...consolidatedState.lines],
                    textElements: [...consolidatedState.textElements],
                    rectangles: [...consolidatedState.rectangles],
                    circles: [...consolidatedState.circles],
                    images: [...consolidatedState.images],
                });

                // Sync history update with Pusher
                syncWithPusher();

                return;
            }
            const isDrawLines = elements[0] && 'points' in elements[0];
            const isRectangles =
                elements[0] &&
                'width' in elements[0] &&
                !('src' in elements[0]);
            const isCircles = elements[0] && 'radius' in elements[0];
            const isImages = elements[0] && 'src' in elements[0];

            newHistory.push({
                lines: isDrawLines ? [...(elements as DrawLine[])] : [...lines],
                textElements:
                    !isDrawLines && !isRectangles && !isCircles && !isImages
                        ? [...(elements as TextElement[])]
                        : [...textElements],
                rectangles: isRectangles
                    ? [...(elements as Rectangle[])]
                    : [...rectangles],
                circles: isCircles ? [...(elements as Circle[])] : [...circles],
                images: isImages ? [...(elements as Image[])] : [...images],
            });

            set({
                history: newHistory,
                currentStep: currentStep + 1,
                lines: isDrawLines ? (elements as DrawLine[]) : lines,
                textElements:
                    !isDrawLines && !isRectangles && !isCircles && !isImages
                        ? (elements as TextElement[])
                        : textElements,
                rectangles: isRectangles
                    ? (elements as Rectangle[])
                    : rectangles,
                circles: isCircles ? (elements as Circle[]) : circles,
                images: isImages ? (elements as Image[]) : images,
            });

            // Sync history update with Pusher
            syncWithPusher();
        },

        undo: () => {
            const { currentStep, history } = get();
            if (currentStep > 0) {
                const newStep = currentStep - 1;
                set({
                    currentStep: newStep,
                    lines: [...history[newStep].lines],
                    textElements: [...history[newStep].textElements],
                    rectangles: [...history[newStep].rectangles],
                    circles: [...history[newStep].circles],
                    images: [...history[newStep].images],
                });

                localStorage.setItem(
                    'lines',
                    JSON.stringify({ lines: history[newStep].lines }),
                );
                localStorage.setItem(
                    'texts',
                    JSON.stringify({
                        textElements: history[newStep].textElements,
                    }),
                );
                localStorage.setItem(
                    'rectangles',
                    JSON.stringify({ rectangles: history[newStep].rectangles }),
                );
                localStorage.setItem(
                    'circles',
                    JSON.stringify({ circles: history[newStep].circles }),
                );
                localStorage.setItem(
                    'images',
                    JSON.stringify({ images: history[newStep].images }),
                );

                // Sync undo action with other clients
                syncWithPusher();
            }
        },

        redo: () => {
            const { currentStep, history } = get();
            if (currentStep < history.length - 1) {
                const newStep = currentStep + 1;
                set({
                    currentStep: newStep,
                    lines: [...history[newStep].lines],
                    textElements: [...history[newStep].textElements],
                    rectangles: [...history[newStep].rectangles],
                    circles: [...history[newStep].circles],
                    images: [...history[newStep].images],
                });

                localStorage.setItem(
                    'lines',
                    JSON.stringify({ lines: history[newStep].lines }),
                );
                localStorage.setItem(
                    'texts',
                    JSON.stringify({
                        textElements: history[newStep].textElements,
                    }),
                );
                localStorage.setItem(
                    'rectangles',
                    JSON.stringify({ rectangles: history[newStep].rectangles }),
                );
                localStorage.setItem(
                    'circles',
                    JSON.stringify({ circles: history[newStep].circles }),
                );
                localStorage.setItem(
                    'images',
                    JSON.stringify({ images: history[newStep].images }),
                );

                // Sync redo action with other clients
                syncWithPusher();
            }
        },

        canUndo: () => {
            return get().currentStep > 0;
        },

        canRedo: () => {
            return get().currentStep < get().history.length - 1;
        },

        clear: (isRemote = false) => {
            const initialState = {
                lines: [],
                textElements: [],
                rectangles: [],
                circles: [],
                images: [],
                history: [
                    {
                        lines: [],
                        textElements: [],
                        rectangles: [],
                        circles: [],
                        images: [],
                    },
                ],
                currentStep: 0,
            };

            set(initialState);

            try {
                localStorage.removeItem('lines');
                localStorage.removeItem('texts');
                localStorage.removeItem('rectangles');
                localStorage.removeItem('circles');
                localStorage.removeItem('images');
            } catch (error) {
                console.warn(
                    'Failed to clear canvas data from localStorage:',
                    error,
                );
            }

            // Sync clear action with other clients if not from remote update
            if (!isRemote && !get().isRemoteUpdate) {
                const roomId = useRoomStore.getState().roomId;
                if (roomId) {
                    const consolidatedState = {
                        lines: [],
                        textElements: [],
                        rectangles: [],
                        circles: [],
                        images: [],
                    };
                    debouncedSendDrawing(
                        consolidatedState,
                        roomId,
                        get().history,
                        get().currentStep,
                    );
                }
            }
        },
    };
});
