import { create } from 'zustand';

interface CanvasState {
    lines: DrawLine[];
    textElements: TextElement[];
    history: { lines: DrawLine[]; textElements: TextElement[] }[];
    currentStep: number;
    setLines: (lines: DrawLine[]) => void;
    addToHistory: (lines: DrawLine[]) => void;
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

    addToHistory: (lines) => {
        const { currentStep, history, textElements } = get();
        const newHistory = history.slice(0, currentStep + 1);
        newHistory.push({ lines: [...lines], textElements: [...textElements] });
        set({
            history: newHistory,
            currentStep: currentStep + 1,
            lines: lines,
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
