"use client";

import React, { useState, useCallback } from "react";
import {
  Globe,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLink,
  AlertTriangle,
  X,
  Loader2,
  Search,
  RefreshCcwIcon,
  Maximize2Icon,
  Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from "@/components/ai-elements/web-preview";
import { toast } from "sonner";
import axios from "axios";

const WebsiteViewer = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // const iframeRef = useRef<HTMLIFrameElement>(null);

  const [logs, setLogs] = useState<
    Array<{
      level: "log" | "warn" | "error";
      message: string;
      timestamp: Date;
    }>
  >([]);

  const validateAndFormatUrl = (url: string) => {
    if (!url) return "";
    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    try {
      new URL(url);
      return url;
    } catch {
      return "";
    }
  };

  const addLog = (level: "log" | "warn" | "error", message: string) => {
    setLogs((prev) => [...prev, { level, message, timestamp: new Date() }]);
  };

  const loadUrl = useCallback(
    (url: string, addToHistory = true) => {
      setError("");
      const formattedUrl = validateAndFormatUrl(url);

      if (!formattedUrl) {
        setError("Please enter a valid URL");
        toast.error("Invalid URL format");
        return;
      }

      setIsLoading(true);
      addLog("log", `Loading ${formattedUrl}...`);

      // Add to backend queue for scraping
      axios
        .post(`${process.env.NEXT_PUBLIC_API_URL}/upload/web-url`, {
          url: formattedUrl,
        })
        .then(() => {
          addLog("log", "Added to processing queue");
        })
        .catch((error) => {
          console.error("Error adding to queue:", error);
          addLog("warn", "Failed to add to processing queue");
        });

      // Load in iframe
      setCurrentUrl(formattedUrl);
      setWebsiteUrl(formattedUrl);
      setInputUrl(formattedUrl);

      // Update history
      if (addToHistory) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(formattedUrl);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    },
    [history, historyIndex]
  );

  const handleUrlSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      loadUrl(inputUrl);
    },
    [inputUrl, loadUrl]
  );

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setCurrentUrl(url);
      setWebsiteUrl(url);
      setInputUrl(url);
      setIsLoading(true);
      addLog("log", `Navigated back to ${url}`);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setCurrentUrl(url);
      setWebsiteUrl(url);
      setInputUrl(url);
      setIsLoading(true);
      addLog("log", `Navigated forward to ${url}`);
    }
  };

  const handleRefresh = () => {
    if (currentUrl) {
      setIsLoading(true);
      addLog("log", "Refreshing page...");
      // Force reload by resetting src
      const tempUrl = websiteUrl;
      setWebsiteUrl("");
      setTimeout(() => {
        setWebsiteUrl(tempUrl);
      }, 50);
      toast.success("Page refreshing");
    }
  };

  const handleHome = () => {
    setWebsiteUrl("");
    setCurrentUrl("");
    setInputUrl("");
    setHistory([]);
    setHistoryIndex(-1);
    setError("");
    addLog("log", "Returned to home");
  };

  const handleOpenInNewTab = () => {
    if (currentUrl) {
      window.open(currentUrl, "_blank", "noopener,noreferrer");
      addLog("log", "Opened in new tab");
      toast.success("Opened in new tab");
    }
  };

  const resetViewer = () => {
    axios
      .delete(`${process.env.NEXT_PUBLIC_API_URL}/delete?name=web-doc`)
      .then(() => {
        setWebsiteUrl("");
        setCurrentUrl("");
        setInputUrl("");
        setHistory([]);
        setHistoryIndex(-1);
        setIsLoading(false);
        setError("");
        setLogs([]);
        toast.success("Viewer reset and data cleared");
      })
      .catch((error) => {
        console.error("Error resetting viewer:", error);
        addLog("error", "Failed to reset viewer");
        toast.error("Failed to reset viewer");
      });
  };

  const handleUrlChange = (url: string) => {
    setCurrentUrl(url);
    setInputUrl(url);
    addLog("log", `URL changed to ${url}`);
  };

  return (
    <div
      className={`${
        fullscreen ? "fixed inset-0 z-50" : "h-full"
      } w-full flex flex-col bg-background`}
    >
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!websiteUrl ? (
          <div className="h-full flex items-center justify-center p-6">
            <Card className="max-w-2xl w-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-6 py-8">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Globe className="w-8 h-8 text-primary" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-semibold">Website Viewer</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Enter any website URL to preview it with an interactive
                      browser console
                    </p>
                  </div>

                  <form
                    onSubmit={handleUrlSubmit}
                    className="w-full max-w-md space-y-4"
                  >
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Enter URL (e.g., google.com, github.com)"
                        className="pl-10 h-12"
                        autoFocus
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      disabled={!inputUrl.trim() || isLoading}
                      size="lg"
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Load Website
                        </>
                      )}
                    </Button>
                  </form>

                  <Alert className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <p className="font-medium mb-1">
                        Website Embedding Notice
                      </p>
                      <p className="text-muted-foreground">
                        Some websites may not display due to security policies.
                        Use the external link button to open in a new tab.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full p-4">
            <WebPreview
              defaultUrl={currentUrl}
              onUrlChange={handleUrlChange}
              className="h-full rounded-lg border shadow-lg"
            >
              <WebPreviewNavigation>
                {/* Back Button */}
                <WebPreviewNavigationButton
                  onClick={handleBack}
                  disabled={historyIndex <= 0}
                  tooltip="Go back"
                >
                  <ArrowLeftIcon className="size-4" />
                </WebPreviewNavigationButton>

                {/* Forward Button */}
                <WebPreviewNavigationButton
                  onClick={handleForward}
                  disabled={historyIndex >= history.length - 1}
                  tooltip="Go forward"
                >
                  <ArrowRightIcon className="size-4" />
                </WebPreviewNavigationButton>

                {/* Refresh Button */}
                <WebPreviewNavigationButton
                  onClick={handleRefresh}
                  tooltip="Reload"
                >
                  <RefreshCcwIcon
                    className={`size-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </WebPreviewNavigationButton>

                {/* Home Button */}
                <WebPreviewNavigationButton onClick={handleHome} tooltip="Home">
                  <Home className="size-4" />
                </WebPreviewNavigationButton>

                {/* URL Input */}
                <WebPreviewUrl
                  value={inputUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setInputUrl(e.target.value)
                  }
                  onSubmit={handleUrlSubmit}
                />

                {/* Open in New Tab */}
                <WebPreviewNavigationButton
                  onClick={handleOpenInNewTab}
                  tooltip="Open in new tab"
                >
                  <ExternalLink className="size-4" />
                </WebPreviewNavigationButton>

                {/* Fullscreen */}
                <WebPreviewNavigationButton
                  onClick={() => setFullscreen(!fullscreen)}
                  tooltip={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  <Maximize2Icon className="size-4" />
                </WebPreviewNavigationButton>

                {/* Close & Reset */}
                <WebPreviewNavigationButton
                  onClick={resetViewer}
                  tooltip="Close and clear data"
                >
                  <X className="size-4" />
                </WebPreviewNavigationButton>
              </WebPreviewNavigation>

              {/* Website Body */}
              <WebPreviewBody
                src={websiteUrl}
                onLoad={() => {
                  setIsLoading(false);
                  addLog("log", "Page loaded successfully");
                }}
                onError={() => {
                  setIsLoading(false);
                  setError(
                    "Failed to load website. Some sites may block embedding."
                  );
                  addLog("error", "Failed to load website in iframe");
                  toast.error(
                    "Failed to load website. Try opening in new tab."
                  );
                }}
              />

              {/* Console */}
              <WebPreviewConsole logs={logs} />
            </WebPreview>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteViewer;
