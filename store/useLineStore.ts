import { create } from 'zustand';

type LineStore = {
    lines: Line[];
    addLine: (line: Line) => void;
    removeLine: (index: number) => void;
    updateLines: (lines: Line[]) => void;
    clearLines: () => void;
};

export const useLineStore = create<LineStore>((set) => ({
    lines: [],
    addLine: (line) => set((state) => ({ lines: [...state.lines, line] })),
    removeLine: (index) =>
        set((state) => ({
            lines: state.lines.filter((_, i) => i !== index),
        })),
    updateLines: (lines) => set({ lines }),
    clearLines: () => set({ lines: [] }),
}));
