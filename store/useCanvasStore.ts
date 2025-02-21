import { create } from 'zustand';

interface CanvasState {
    lines: DrawLine[];
    textElements: TextElement[];
    rectangles: Rectangle[];
    history: {
        lines: DrawLine[];
        textElements: TextElement[];
        rectangles: Rectangle[];
    }[];
    currentStep: number;
    setLines: (lines: DrawLine[]) => void;
    addToHistory: (lines: DrawLine[] | TextElement[] | Rectangle[]) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    setTextElements: (textElements: TextElement[]) => void;
    setRectangles: (rectangles: Rectangle[]) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    lines: [],
    textElements: [],
    rectangles: [],
    history: [{ lines: [], textElements: [], rectangles: [] }],
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

    addToHistory: (elements: DrawLine[] | TextElement[] | Rectangle[]) => {
        const { currentStep, history, lines, textElements, rectangles } = get();
        const newHistory = history.slice(0, currentStep + 1);
        const isDrawLines = elements[0] && 'points' in elements[0];
        const isRectangles = elements[0] && 'width' in elements[0];

        newHistory.push({
            lines: isDrawLines ? [...(elements as DrawLine[])] : [...lines],
            textElements:
                !isDrawLines && !isRectangles
                    ? [...(elements as TextElement[])]
                    : [...textElements],
            rectangles: isRectangles
                ? [...(elements as Rectangle[])]
                : [...rectangles],
        });

        set({
            history: newHistory,
            currentStep: currentStep + 1,
            lines: isDrawLines ? (elements as DrawLine[]) : lines,
            textElements:
                !isDrawLines && !isRectangles
                    ? (elements as TextElement[])
                    : textElements,
            rectangles: isRectangles ? (elements as Rectangle[]) : rectangles,
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
