"use client";
import Chat from "@/components/chat2";
import { useChatStore } from "../store/store";

export default function Page() {
  const message = useChatStore((s) => s.message);
  return (
    <div className="flex h-screen  items-center justify-center">
      <Chat userQuery={message} />
    </div>
  );
}
