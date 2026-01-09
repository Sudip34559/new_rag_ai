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

  const handleUrlSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError("");

      const formattedUrl = validateAndFormatUrl(inputUrl);

      if (!formattedUrl) {
        setError("Please enter a valid URL");
        toast.error("Invalid URL format");
        return;
      }

      setIsLoading(true);
      addLog("log", `Loading ${formattedUrl}...`);

      axios
        .post(`${process.env.NEXT_PUBLIC_API_URL}/upload/web-url`, {
          url: inputUrl,
        })
        .then(() => {
          setCurrentUrl(formattedUrl);
          setWebsiteUrl(
            `${process.env.NEXT_PUBLIC_API_URL}/proxy?url=${encodeURIComponent(
              inputUrl
            )}`
          );
          setIsLoading(false);
          addLog("log", "Website loaded successfully");
          toast.success("Website loaded successfully");
        })
        .catch((error) => {
          console.error("Error loading website:", error);
          setIsLoading(false);
          addLog("error", `Failed to load website: ${error.message}`);
          toast.error("Failed to load website");
        });
    },
    [inputUrl]
  );

  const handleRefresh = () => {
    if (websiteUrl) {
      setIsLoading(true);
      addLog("log", "Refreshing page...");
      // Trigger reload
      setWebsiteUrl("");
      setTimeout(() => {
        setWebsiteUrl(
          `${process.env.NEXT_PUBLIC_API_URL}/proxy?url=${encodeURIComponent(
            inputUrl
          )}`
        );
        setIsLoading(false);
        addLog("log", "Page refreshed");
        toast.success("Page refreshed");
      }, 100);
    }
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
        setIsLoading(false);
        setError("");
        setLogs([]);
        toast.success("Viewer reset");
      })
      .catch((error) => {
        console.error("Error resetting viewer:", error);
        addLog("error", "Failed to reset viewer");
        toast.error("Failed to reset viewer");
      });
  };

  // const getDomainName = (url: string) => {
  //   try {
  //     return new URL(url).hostname;
  //   } catch {
  //     return url;
  //   }
  // };

  return (
    <div className="h-full w-full flex flex-col bg-background">
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
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading website...
                  </p>
                </div>
              </div>
            ) : (
              <WebPreview
                defaultUrl={currentUrl}
                onUrlChange={(url: string) => {
                  setCurrentUrl(url);
                  addLog("log", `Navigated to ${url}`);
                }}
                style={{ height: fullscreen ? "100vh" : "100%" }}
                className="rounded-lg border"
              >
                <WebPreviewNavigation>
                  <WebPreviewNavigationButton
                    onClick={() => {
                      addLog("log", "Navigate back");
                      // Add back navigation logic
                    }}
                    tooltip="Go back"
                  >
                    <ArrowLeftIcon className="size-4" />
                  </WebPreviewNavigationButton>

                  <WebPreviewNavigationButton
                    onClick={() => {
                      addLog("log", "Navigate forward");
                      // Add forward navigation logic
                    }}
                    tooltip="Go forward"
                  >
                    <ArrowRightIcon className="size-4" />
                  </WebPreviewNavigationButton>

                  <WebPreviewNavigationButton
                    onClick={handleRefresh}
                    tooltip="Reload"
                  >
                    <RefreshCcwIcon className="size-4" />
                  </WebPreviewNavigationButton>

                  <WebPreviewUrl />

                  <WebPreviewNavigationButton
                    onClick={handleOpenInNewTab}
                    tooltip="Open in new tab"
                  >
                    <ExternalLink className="size-4" />
                  </WebPreviewNavigationButton>

                  <WebPreviewNavigationButton
                    onClick={() => setFullscreen(!fullscreen)}
                    tooltip="Maximize"
                  >
                    <Maximize2Icon className="size-4" />
                  </WebPreviewNavigationButton>

                  <WebPreviewNavigationButton
                    onClick={resetViewer}
                    tooltip="Close"
                  >
                    <X className="size-4" />
                  </WebPreviewNavigationButton>
                </WebPreviewNavigation>

                <WebPreviewBody src={websiteUrl} />

                <WebPreviewConsole logs={logs} />
              </WebPreview>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteViewer;
