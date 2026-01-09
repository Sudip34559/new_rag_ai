// store.ts
import { create } from "zustand";
interface ChatState {
  message: string;
  setMessage: (msg: string) => void;
}
export const useChatStore = create<ChatState>((set) => ({
  message: "",
  setMessage: (msg: string) => set({ message: msg }),
}));
