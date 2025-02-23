import { create } from 'zustand';

interface CanvasState {
    lines: DrawLine[];
    textElements: TextElement[];
    rectangles: Rectangle[];
    circles: Circle[];
    history: {
        lines: DrawLine[];
        textElements: TextElement[];
        rectangles: Rectangle[];
        circles: Circle[];
    }[];
    currentStep: number;
    setLines: (lines: DrawLine[]) => void;
    addToHistory: (
        lines: DrawLine[] | TextElement[] | Rectangle[] | Circle[],
    ) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    setTextElements: (textElements: TextElement[]) => void;
    setRectangles: (rectangles: Rectangle[]) => void;
    setCircles: (circles: Circle[]) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    lines: [],
    textElements: [],
    rectangles: [],
    circles: [],
    history: [{ lines: [], textElements: [], rectangles: [], circles: [] }],
    currentStep: 0,

    setTextElements: (textElements) => {
        set({ textElements });
    },

    setLines: (lines) => {
        set({ lines });
    },

    setRectangles: (rectangles) => {
        set({ rectangles });
    },

    setCircles: (circles) => {
        set({ circles });
    },

    addToHistory: (
        elements: DrawLine[] | TextElement[] | Rectangle[] | Circle[],
    ) => {
        const {
            currentStep,
            history,
            lines,
            textElements,
            rectangles,
            circles,
        } = get();
        const newHistory = history.slice(0, currentStep + 1);
        const isDrawLines = elements[0] && 'points' in elements[0];
        const isRectangles = elements[0] && 'width' in elements[0];
        const isCircles = elements[0] && 'radius' in elements[0];

        newHistory.push({
            lines: isDrawLines ? [...(elements as DrawLine[])] : [...lines],
            textElements:
                !isDrawLines && !isRectangles && !isCircles
                    ? [...(elements as TextElement[])]
                    : [...textElements],
            rectangles: isRectangles
                ? [...(elements as Rectangle[])]
                : [...rectangles],
            circles: isCircles ? [...(elements as Circle[])] : [...circles],
        });

        set({
            history: newHistory,
            currentStep: currentStep + 1,
            lines: isDrawLines ? (elements as DrawLine[]) : lines,
            textElements:
                !isDrawLines && !isRectangles && !isCircles
                    ? (elements as TextElement[])
                    : textElements,
            rectangles: isRectangles ? (elements as Rectangle[]) : rectangles,
            circles: isCircles ? (elements as Circle[]) : circles,
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
            });
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
            });
        }
    },

    canUndo: () => {
        return get().currentStep > 0;
    },

    canRedo: () => {
        return get().currentStep < get().history.length - 1;
    },
}));
