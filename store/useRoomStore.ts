import { create } from 'zustand';

interface RoomState {
    roomId: string | null;
    isSyncing: boolean;
    setRoomId: (roomId: string | null) => void;
    setSyncing: (isSyncing: boolean) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
    roomId: null,
    isSyncing: false,
    setRoomId: (roomId: string | null) => set({ roomId }),
    setSyncing: (isSyncing: boolean) => set({ isSyncing }),
}));
