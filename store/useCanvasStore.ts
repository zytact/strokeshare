import { create } from 'zustand';

interface CanvasState {
    lines: DrawLine[];
    textElements: TextElement[];
    history: { lines: DrawLine[]; textElements: TextElement[] }[];
    currentStep: number;
    setLines: (lines: DrawLine[]) => void;
    addToHistory: (lines: DrawLine[] | TextElement[]) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    setTextElements: (textElements: TextElement[]) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    lines: [],
    textElements: [],
    history: [{ lines: [], textElements: [] }],
    currentStep: 0,

    setTextElements: (textElements) => {
        set({ textElements });
    },

    setLines: (lines) => {
        set({ lines });
    },

    addToHistory: (elements: DrawLine[] | TextElement[]) => {
        const { currentStep, history, lines, textElements } = get();
        const newHistory = history.slice(0, currentStep + 1);
        const isDrawLines = elements[0] && 'points' in elements[0];
        newHistory.push({
            lines: isDrawLines ? [...(elements as DrawLine[])] : [...lines],
            textElements: !isDrawLines
                ? [...(elements as TextElement[])]
                : [...textElements],
        });
        set({
            history: newHistory,
            currentStep: currentStep + 1,
            lines: isDrawLines ? (elements as DrawLine[]) : lines,
            textElements: !isDrawLines
                ? (elements as TextElement[])
                : textElements,
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
