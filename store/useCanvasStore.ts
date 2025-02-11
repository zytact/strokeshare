import { create } from 'zustand';

interface LineStore {
    lines: Line[];
    removedLines: Line[]; // Add this to store removed lines
    addLine: (line: Line) => void;
    removeLine: (index: number) => void;
    updateLines: (lines: Line[]) => void;
    redo: () => void; // Add redo function
    clearLines: () => void; // Add helper function
}

type EraserStore = {
    isEraserMode: boolean;
    toggleEraseMode: () => void;
};

export const useLineStore = create<LineStore>((set) => ({
    lines: [],
    removedLines: [],
    addLine: (line) =>
        set((state) => ({
            lines: [...state.lines, line],
            removedLines: [], // Clear redo history when new line is added
        })),
    removeLine: (index) =>
        set((state) => ({
            lines: state.lines.slice(0, index),
            removedLines: [state.lines[index], ...state.removedLines],
        })),
    updateLines: (lines) => set({ lines }),
    redo: () =>
        set((state) => {
            if (state.removedLines.length === 0) return state;
            const [lineToRestore, ...remainingRemovedLines] =
                state.removedLines;
            return {
                lines: [...state.lines, lineToRestore],
                removedLines: remainingRemovedLines,
            };
        }),
    clearLines: () => set({ lines: [] }),
}));

export const useEraserStore = create<EraserStore>((set) => ({
    isEraserMode: false,
    toggleEraseMode: () =>
        set((state) => ({ isEraserMode: !state.isEraserMode })),
}));
