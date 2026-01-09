"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  Upload,
  FileText,
  ZoomIn,
  ZoomOut,
  Download,
  X,
  Loader2,
  File,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import axios from "axios";

const PdfViewer = () => {
  const [pdfUrl, setPdfUrl] = useState("");
  const [publicId, setPublicId] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(1.0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendFileToServer = useCallback((file: File) => {
    const formData = new FormData();
    formData.append("pdf", file);

    axios
      .post(`${process.env.NEXT_PUBLIC_API_URL}/upload/pdf`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        setPdfUrl(res.data.fileUrl);
        setPublicId(res.data.publicId);
        setFileName(file.name);
        setIsLoading(false);
        toast.success("PDF uploaded successfully");
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
        setIsLoading(false);
        toast.error("Failed to upload PDF");
      });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a valid PDF file");
      return;
    }

    setIsLoading(true);
    sendFileToServer(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.type !== "application/pdf") {
          toast.error("Please select a valid PDF file");
          return;
        }
        setIsLoading(true);
        sendFileToServer(file);
      }
    },
    [sendFileToServer]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleZoom = (zoomDelta: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale + zoomDelta));
    setScale(newScale);

    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${newScale})`;
      iframeRef.current.style.transformOrigin = "top left";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const downloadPdf = () => {
    if (pdfUrl && fileName) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = fileName;
      link.click();
      toast.success("PDF download started");
    }
  };

  const deletePdf = () => {
    axios
      .delete(
        `${process.env.NEXT_PUBLIC_API_URL}/delete?name=pdf-doc&publicId=${publicId}`
      )
      .then(() => {
        setPdfUrl("");
        setPublicId("");
        setFileName("");
        setScale(1.0);
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        toast.success("PDF deleted successfully");
      })
      .catch((error) => {
        console.error("Error deleting PDF:", error);
        toast.error("Failed to delete PDF");
      });
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      {pdfUrl && (
        <div className="border-b bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold truncate">{fileName}</h2>
                <p className="text-xs text-muted-foreground">PDF Document</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleZoom(-0.2)}
                        disabled={scale <= 0.5}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom Out</TooltipContent>
                  </Tooltip>

                  <Badge variant="secondary" className="h-8 px-3">
                    {Math.round(scale * 100)}%
                  </Badge>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleZoom(0.2)}
                        disabled={scale >= 3}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom In</TooltipContent>
                  </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-8" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={downloadPdf}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download PDF</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={deletePdf}>
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Close PDF</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!pdfUrl ? (
          <div className="h-full flex items-center justify-center p-6">
            <Card
              className={`max-w-xl w-full transition-all duration-200 ${
                isDragOver
                  ? "border-primary shadow-lg scale-[1.02]"
                  : "border-dashed"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">
                      Upload PDF Document
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Drag and drop your PDF file here, or click the button
                      below to browse
                    </p>
                  </div>

                  <Button
                    onClick={triggerFileInput}
                    disabled={isLoading}
                    size="lg"
                    className="mt-4"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <File className="mr-2 h-4 w-4" />
                        Choose File
                      </>
                    )}
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  <div className="pt-4">
                    <p className="text-xs text-muted-foreground">
                      Supported format: PDF (max 50MB)
                    </p>
                  </div>
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
                    Loading PDF...
                  </p>
                </div>
              </div>
            ) : (
              <Card className="h-full overflow-hidden">
                <CardContent className="p-0 h-full">
                  <div className="w-full h-full overflow-auto bg-muted/30">
                    <iframe
                      ref={iframeRef}
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border-0 block"
                      title="PDF Viewer"
                      style={{
                        minHeight: "100%",
                        minWidth: "100%",
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                        width: scale !== 1 ? `${100 / scale}%` : "100%",
                        height: scale !== 1 ? `${100 / scale}%` : "100%",
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
