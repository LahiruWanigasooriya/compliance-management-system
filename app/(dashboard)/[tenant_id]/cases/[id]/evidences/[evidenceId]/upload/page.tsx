"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadEvidenceFile, getCaseById } from "@/actions/cases.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ICONS } from "@/constants/constants";
import type { Case, Evidence } from "@/types/cases.types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BASE64_SIZE = 6.5 * 1024 * 1024; // 6.5MB (accounts for base64 encoding ~33% overhead)

type RouteParams = {
  tenant_id: string;
  id: string;
  evidenceId: string;
};

const UploadEvidencePage = () => {
  const router = useRouter();
  const params = useParams<RouteParams>();
  const tenantId = params.tenant_id;
  const caseId = params.id;
  const evidenceId = params.evidenceId;

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64String, setBase64String] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Generate a preview for image files
  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  // Fetch case data to display existing evidences
  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        setIsLoadingCase(true);
        const data = await getCaseById(caseId, tenantId);
        setCaseData(data);
      } catch (error) {
        console.error("Error fetching case data:", error);
        toast.error("Failed to load case information");
      } finally {
        setIsLoadingCase(false);
      }
    };

    if (caseId && tenantId) {
      fetchCaseData();
    }
  }, [caseId, tenantId]);

  const fileToBase64 = (selectedFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1];

        if (base64Data.length > MAX_BASE64_SIZE) {
          toast.error(
            `Base64 size exceeds 6.5MB limit (${Math.round((base64Data.length / 1024 / 1024) * 100) / 100}MB)`,
          );
          reject(new Error("Base64 size exceeds limit"));
          return;
        }

        console.log("Base64 conversion:", {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          base64Size: base64Data.length,
          base64SizeMB:
            Math.round((base64Data.length / 1024 / 1024) * 100) / 100,
          base64Preview: base64Data.substring(0, 100) + "...",
        });
        setBase64String(base64Data);
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Clear the value to prevent browser notification
    event.target.value = "";

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 5MB");
      setFile(null);
      return;
    }

    // Restrict to images and PDF (server expectation)
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!allowed.includes(selectedFile.type)) {
      toast.error("Unsupported file type. Use PDF or image (PNG/JPG/WebP).");
      return;
    }

    setFile(selectedFile);
  };

  const clearSelection = () => {
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
    setBase64String(null);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (dropped.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 5MB");
      return;
    }
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!allowed.includes(dropped.type)) {
      toast.error("Unsupported file type. Use PDF or image (PNG/JPG/WebP).");
      return;
    }
    setFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file before uploading");
      return;
    }

    try {
      setIsUploading(true);
      const base64 = await fileToBase64(file);
      await uploadEvidenceFile(evidenceId, base64, tenantId);
      toast.success("Evidence uploaded successfully");
      router.push(`/`);
    } catch (error: any) {
      console.error("Error uploading evidence", error);
      toast.error(error?.message || "Failed to upload evidence");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-1920px mx-auto space-y-8">
      <div className="flex items-left sm:items-center flex-col sm:flex-row justify-between gap-3">
        <div className="flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ICONS.ChevronLeft size={18} />
          </Button>
          <div className="flex flex-col gap-1 ">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Evidence Upload
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              Upload document for case
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-left text-left gap-1 text-sm text-muted-foreground">
          <p>Tenant {tenantId}</p>
          <p>Case {caseId}</p>
          <p>Evidence {evidenceId}</p>
        </div>
      </div>

      {/* Case Information */}
      {caseData && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Case Title
              </p>
              <h2 className="text-lg font-semibold text-foreground">
                {caseData.title || "Untitled Case"}
              </h2>
            </div>
            {caseData.description && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Case Description
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {caseData.description}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  caseData.priority === "critical"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : caseData.priority === "high"
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      : caseData.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                }`}
              >
                {caseData.priority}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {caseData.status?.replace(/_/g, " ")}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {caseData.category}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ICONS.Upload size={18} />
            Document Submit
          </h2>
        </div>

        <div className="space-y-4">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={
              `relative rounded-lg border-2 border-dashed p-6 transition-colors ` +
              (dragActive
                ? "border-primary/60 bg-primary/5"
                : "border-muted-foreground/30 hover:border-muted-foreground/50")
            }
            aria-label="Upload file dropzone"
          >
            {!file ? (
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <ICONS.Upload size={22} className="text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Drag & drop</span> your file
                  here, or
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                    className="ml-1 underline cursor-pointer underline-offset-2 text-foreground hover:text-foreground/80 font-medium"
                    disabled={isUploading}
                  >
                    browse
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF or image (PNG/JPG/WebP), up to 5MB
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="size-20 shrink-0 overflow-hidden rounded bg-muted flex items-center justify-center">
                  {previewUrl ? (
                    // Image preview
                    <img
                      src={previewUrl}
                      alt="Selected preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    // File icon (PDF/other)
                    <ICONS.FileText
                      className="text-muted-foreground"
                      size={32}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(file.type || "unknown")
                      .replace("application/", "")
                      .toUpperCase()}{" "}
                    · {Math.round((file.size / 1024 / 1024) * 100) / 100} MB
                    {base64String && (
                      <>
                        {" "}
                        · Base64:{" "}
                        {Math.round((base64String.length / 1024) * 100) /
                          100}{" "}
                        KB
                      </>
                    )}
                  </div>
                  {!isUploading && (
                    <button
                      onClick={clearSelection}
                      aria-label="Remove file"
                      className="mt-2 px-3 py-1.5 bg-card text-foreground border border-border rounded-lg hover:bg-muted transition-all text-xs font-medium flex items-center gap-1.5"
                    >
                      <ICONS.X size={14} /> Remove
                    </button>
                  )}
                </div>
              </div>
            )}

            <Input
              ref={inputRef}
              id="evidence-file"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
              aria-hidden
              tabIndex={-1}
              title=""
            />
          </div>

          <p className="text-xs text-muted-foreground">Max size 5MB.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={isUploading || !file}
            aria-busy={isUploading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            {isUploading ? (
              <>
                <ICONS.RefreshCw className="animate-spin" size={16} />
                <span>Uploading</span>
              </>
            ) : (
              <>
                <ICONS.Upload size={16} />
                <span>Upload Evidence</span>
              </>
            )}
          </button>
          <Link
            href={`/`}
            className={`px-4 py-2 bg-card text-foreground border border-border rounded-lg hover:bg-muted transition-all text-sm font-medium flex items-center gap-2 shadow-sm ${
              isUploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <ICONS.X size={16} />
            <span>Cancel</span>
          </Link>
        </div>
      </div>

      {/* Past Evidences Section */}
      {caseData && caseData.evidences && caseData.evidences.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ICONS.FileText size={18} />
              Past Evidence ({caseData.evidences.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Previously uploaded documents for this case
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">
                    Document Name
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">
                    Size
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">
                    Uploaded
                  </th>
                </tr>
              </thead>
              <tbody>
                {caseData.evidences.map((evidence: Evidence) => (
                  <tr
                    key={evidence.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground">
                      {evidence.document_name || "Untitled"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {evidence.content_type?.toUpperCase() || "Unknown"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {Math.round((evidence.size / 1024) * 100) / 100} KB
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          evidence.status === "uploaded"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : evidence.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {evidence.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {evidence.uploaded_at
                        ? new Date(evidence.uploaded_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadEvidencePage;
