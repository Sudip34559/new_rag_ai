"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  Video,
  Play,
  RotateCw,
  ExternalLink,
  AlertTriangle,
  X,
  Loader2,
  Youtube,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import axios from "axios";

const YouTubeViewer = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const extractVideoId = (url: string) => {
    if (!url) return null;

    url = url.trim();

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  const getVideoTitle = (videoId: string) => {
    return `YouTube Video: ${videoId}`;
  };

  const handleUrlSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError("");

      const videoId = extractVideoId(inputUrl);

      if (!videoId) {
        setError("Please enter a valid YouTube URL or video ID");
        toast.error("Invalid YouTube URL");
        return;
      }

      setIsLoading(true);

      axios
        .post(`${process.env.NEXT_PUBLIC_API_URL}/upload/youtube-video`, {
          url: inputUrl,
        })
        .then(() => {
          const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
          setCurrentUrl(inputUrl);
          setVideoUrl(embedUrl);
          setVideoTitle(getVideoTitle(videoId));
          setIsLoading(false);
          toast.success("Video loaded successfully");
        })
        .catch((error) => {
          console.error("Error loading video:", error);
          setIsLoading(false);
          toast.error("Failed to load video");
        });
    },
    [inputUrl]
  );

  const openInYouTube = () => {
    if (currentUrl) {
      const videoId = extractVideoId(currentUrl);
      if (videoId) {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
        toast.success("Opened on YouTube");
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const resetViewer = () => {
    axios
      .delete(
        `${process.env.NEXT_PUBLIC_API_URL}/delete?name=youtube-vedio-trans`
      )
      .then(() => {
        setVideoUrl("");
        setCurrentUrl("");
        setInputUrl("");
        setVideoTitle("");
        setIsLoading(false);
        setError("");
        setIsFullscreen(false);
        toast.success("Viewer reset");
      })
      .catch((error) => {
        console.error("Error resetting viewer:", error);
        toast.error("Failed to reset viewer");
      });
  };

  const refreshVideo = () => {
    if (videoUrl) {
      setIsLoading(true);
      const currentSrc = videoUrl;
      setVideoUrl("");
      setTimeout(() => {
        setVideoUrl(currentSrc);
        setIsLoading(false);
        toast.success("Video refreshed");
      }, 100);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      {videoUrl && (
        <div className="border-b bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10">
                <Youtube className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold truncate">{videoTitle}</h2>
                <p className="text-xs text-muted-foreground">YouTube Video</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={refreshVideo}>
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh Video</TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-8" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={openInYouTube}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open on YouTube</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={resetViewer}>
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Close</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!videoUrl ? (
          <div className="h-full flex items-center justify-center p-6">
            <Card className="max-w-2xl w-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-6 py-8">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
                    <Youtube className="w-8 h-8 text-red-500" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-semibold">
                      YouTube Video Viewer
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Paste any YouTube video URL or video ID to watch it in an
                      embedded player
                    </p>
                  </div>

                  <form
                    onSubmit={handleUrlSubmit}
                    className="w-full max-w-md space-y-4"
                  >
                    <div className="relative">
                      <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Enter YouTube URL or video ID"
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
                          <Play className="mr-2 h-4 w-4" />
                          Load Video
                        </>
                      )}
                    </Button>
                  </form>

                  <Alert className="max-w-md">
                    <Youtube className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-xs">
                      <p className="font-medium mb-2">Supported Formats:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• youtube.com/watch?v=VIDEO_ID</li>
                        <li>• youtu.be/VIDEO_ID</li>
                        <li>• youtube.com/embed/VIDEO_ID</li>
                        <li>• Direct video ID (11 characters)</li>
                      </ul>
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
                  <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                  <p className="text-sm text-muted-foreground">
                    Loading video...
                  </p>
                </div>
              </div>
            ) : (
              <Card
                ref={videoContainerRef}
                className="h-full overflow-hidden relative p-0"
              >
                <CardContent className="p-0 h-full">
                  <div className="w-full h-full bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={videoUrl}
                      className="w-full h-full border-0"
                      title="YouTube Video Player"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                </CardContent>

                {/* Floating Info Bar */}
                {/* {!isFullscreen && (
                  <div className="absolute top-4 left-4 right-4">
                    <Card className="shadow-lg bg-background/95 backdrop-blur">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Youtube className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <span className="text-sm truncate flex-1">
                            {videoTitle}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={openInYouTube}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )} */}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeViewer;
