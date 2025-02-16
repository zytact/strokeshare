import { create } from 'zustand';

type LineStore = {
    lines: Line[];
    history: Line[][]; // Store states history
    historyIndex: number; // Track current position in history
    addLine: (line: Line) => void;
    updateLines: (lines: Line[]) => void;
    undo: () => void;
    redo: () => void;
    clearLines: () => void;
};

export const useLineStore = create<LineStore>((set) => ({
    lines: [],
    history: [[]], // Initialize with an empty state
    historyIndex: 0, // Start at the initial empty state
    addLine: (line) =>
        set((state) => {
            const newLines = [...state.lines, line];
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            return {
                lines: newLines,
                history: [...newHistory, newLines],
                historyIndex: state.historyIndex + 1,
            };
        }),
    updateLines: (lines) =>
        set((state) => {
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            return {
                lines,
                history: [...newHistory, lines],
                historyIndex: state.historyIndex + 1,
            };
        }),
    undo: () =>
        set((state) => {
            if (state.historyIndex < 0) return state;
            const newIndex = state.historyIndex - 1;
            return {
                lines: state.history[newIndex] || [],
                history: state.history,
                historyIndex: newIndex,
            };
        }),
    redo: () =>
        set((state) => {
            if (state.historyIndex >= state.history.length - 1) return state;
            const newIndex = state.historyIndex + 1;
            return {
                lines: state.history[newIndex],
                history: state.history,
                historyIndex: newIndex,
            };
        }),
    clearLines: () =>
        set((state) => ({
            lines: [],
            history: [...state.history, []],
            historyIndex: state.historyIndex + 1,
        })),
}));

type EraserStore = {
    isEraserMode: boolean;
    toggleEraseMode: () => void;
};

export const useEraserStore = create<EraserStore>((set) => ({
    isEraserMode: false,
    toggleEraseMode: () =>
        set((state) => ({ isEraserMode: !state.isEraserMode })),
}));
