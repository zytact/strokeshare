import { create } from 'zustand';

interface CanvasState {
    lines: DrawLine[];
    textElements: TextElement[];
    rectangles: Rectangle[];
    circles: Circle[];
    images: Image[];
    history: {
        lines: DrawLine[];
        textElements: TextElement[];
        rectangles: Rectangle[];
        circles: Circle[];
        images: Image[];
    }[];
    currentStep: number;
    setLines: (lines: DrawLine[]) => void;
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
    setTextElements: (textElements: TextElement[]) => void;
    setRectangles: (rectangles: Rectangle[]) => void;
    setCircles: (circles: Circle[]) => void;
    setImages: (images: Image[]) => void;
    clear: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
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

    setTextElements: (textElements) => {
        set({ textElements });
        localStorage.setItem('texts', JSON.stringify({ textElements }));
    },

    setLines: (lines) => {
        set({ lines });
        localStorage.setItem('lines', JSON.stringify({ lines }));
    },

    setRectangles: (rectangles) => {
        set({ rectangles });
        localStorage.setItem('rectangles', JSON.stringify({ rectangles }));
    },

    setCircles: (circles) => {
        set({ circles });
        localStorage.setItem('circles', JSON.stringify({ circles }));
    },

    setImages: (images) => {
        set({ images });
        localStorage.setItem('images', JSON.stringify({ images }));
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

            return;
        }
        const isDrawLines = elements[0] && 'points' in elements[0];
        const isRectangles =
            elements[0] && 'width' in elements[0] && !('src' in elements[0]);
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
            rectangles: isRectangles ? (elements as Rectangle[]) : rectangles,
            circles: isCircles ? (elements as Circle[]) : circles,
            images: isImages ? (elements as Image[]) : images,
        });
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
                JSON.stringify({ textElements: history[newStep].textElements }),
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
                JSON.stringify({ textElements: history[newStep].textElements }),
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
        }
    },

    canUndo: () => {
        return get().currentStep > 0;
    },

    canRedo: () => {
        return get().currentStep < get().history.length - 1;
    },

    clear: () => {
        set({
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
        });
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
    },
}));
