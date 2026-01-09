"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useEffect, useState } from "react";

export default function ResizableSplitView({
  leftPlane,
  rightPlane,
}: {
  leftPlane?: React.ReactNode;
  rightPlane?: React.ReactNode;
}) {
  const [direction, setDirection] = useState<"horizontal" | "vertical">(
    "horizontal"
  );

  useEffect(() => {
    const handleResize = () => {
      // Switch to vertical on small screens (< 768px)
      setDirection(window.innerWidth < 768 ? "vertical" : "horizontal");
    };

    // Set initial direction
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="h-screen w-full">
      <ResizablePanelGroup
        direction={direction}
        className="min-h-screen  border"
      >
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <div className="flex h-full items-center justify-center ">
            {leftPlane}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <div className="flex h-full items-center justify-center">
            {rightPlane}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
