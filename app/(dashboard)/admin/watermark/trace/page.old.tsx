"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Upload,
  User,
  Mail,
  Clock,
  Fingerprint,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileImage,
  FileText,
} from "lucide-react";
import {
  adminService,
  type TraceWatermarkResponse,
} from "@/lib/services/adminService";

export default function WatermarkTracePage() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin(user.role))) {
      redirect("/dashboard");
    }
  }, [user, isLoading]);

  const [isDragging, setIsDragging] = useState(false);
  const [tracing, setTracing] = useState(false);
  const [result, setResult] = useState<TraceWatermarkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const allowed = ["application/pdf", "image/png", "image/bmp"];
    if (!allowed.includes(file.type)) {
      setError("Only PDF, PNG, and BMP files are supported.");
      return;
    }
    setFileName(file.name);
    setResult(null);
    setError(null);
    setTracing(true);
    try {
      const res = await adminService.traceWatermark(file);
      setResult(res);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "Trace failed. Please try again.";
      setError(msg);
    } finally {
      setTracing(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const methodLabel: Record<string, string> = {
    lsb: "LSB Steganography (Image)",
    pdf_metadata: "PDF Metadata Embed",
    not_found: "No Watermark Found",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin(user.role)) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-8 w-8" />
          Watermark Trace
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload a suspect file to extract the embedded forensic watermark and
          identify who downloaded it.
        </p>
      </div>

      {/* Supported formats note */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileImage className="h-4 w-4" />
          PNG / BMP — LSB steganography
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          PDF — metadata embed
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`rounded-xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center py-16 gap-4
          ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20"}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.bmp"
          className="hidden"
          onChange={onInputChange}
        />
        <div className="p-4 rounded-full bg-muted">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium">
            {isDragging ? "Drop to trace…" : "Drop file here or click to browse"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            PDF, PNG, BMP — max 50 MB
          </p>
        </div>
        {tracing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Analyzing {fileName}…
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl border bg-card">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            {result.found ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <h2 className="text-lg font-semibold">
              {result.found ? "Watermark Detected" : "No Watermark Found"}
            </h2>
            <Badge
              variant="outline"
              className={
                result.found
                  ? "ml-auto bg-green-500/10 text-green-600 border-green-500/20"
                  : "ml-auto"
              }
            >
              {methodLabel[result.method] ?? result.method}
            </Badge>
          </div>

          {result.found ? (
            <div className="divide-y">
              {result.name && (
                <div className="px-6 py-4 flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Name
                    </p>
                    <p className="text-sm font-medium mt-0.5">{result.name}</p>
                  </div>
                </div>
              )}
              {result.email && (
                <div className="px-6 py-4 flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Email
                    </p>
                    <p className="text-sm font-medium mt-0.5">{result.email}</p>
                  </div>
                </div>
              )}
              {result.user_id && (
                <div className="px-6 py-4 flex items-center gap-3">
                  <Fingerprint className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      User ID
                    </p>
                    <p className="text-sm font-mono mt-0.5">{result.user_id}</p>
                  </div>
                </div>
              )}
              {result.timestamp && (
                <div className="px-6 py-4 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Download Timestamp
                    </p>
                    <p className="text-sm mt-0.5">
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              <p>
                No forensic watermark could be extracted from{" "}
                <span className="font-medium">{fileName}</span>.
              </p>
              <p className="mt-1 text-xs">
                The file may not have been downloaded through the forensic
                watermark flow, or may have been modified.
              </p>
            </div>
          )}

          <div className="px-6 py-3 border-t bg-muted/30 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResult(null);
                setFileName(null);
                setError(null);
              }}
            >
              Trace Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
