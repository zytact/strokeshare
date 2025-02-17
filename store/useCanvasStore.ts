import { create } from 'zustand';

interface CanvasState {
    lines: DrawLine[];
    history: DrawLine[][];
    currentStep: number;
    setLines: (lines: DrawLine[]) => void;
    addToHistory: (lines: DrawLine[]) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    lines: [],
    history: [[]],
    currentStep: 0,

    setLines: (lines) => {
        set({ lines });
    },

    addToHistory: (lines) => {
        const { currentStep, history } = get();
        const newHistory = history.slice(0, currentStep + 1);
        newHistory.push([...lines]);
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
                lines: [...history[newStep]],
            });
        }
    },

    redo: () => {
        const { currentStep, history } = get();
        if (currentStep < history.length - 1) {
            const newStep = currentStep + 1;
            set({
                currentStep: newStep,
                lines: [...history[newStep]],
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
