import { create } from 'zustand';

interface DownloadPopState {
    exportWithBackground: boolean;
    setExportWithBackground: (exportWithBackground: boolean) => void;
}

export const useDownloadPopStore = create<DownloadPopState>((set) => ({
    exportWithBackground: true,
    setExportWithBackground: (exportWithBackground) => {
        set({ exportWithBackground });
    },
}));
