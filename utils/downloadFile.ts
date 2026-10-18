export default function downloadFile(blob: Blob, fileName: string, contentType?: string) {
  const fileBlob = contentType ? new Blob([blob], { type: contentType }) : blob;
  const downloadUrl = window.URL.createObjectURL(fileBlob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(downloadUrl);
}
