"use client";

import { ICONS } from "@/constants/constants";

export interface DocumentModel {
  readonly id: string;
  readonly link: string;
}

interface DocumentGalleryProps {
  readonly docs: readonly DocumentModel[];
  readonly emptyMessage?: string;
}

const DownloadIcon = ICONS.Download;
const FileTextIcon = ICONS.FileText;

export default function DocumentGallery({
  docs,
  emptyMessage = "No documents available",
}: DocumentGalleryProps) {
  return (
    <>
      <style>{`
        .docs-container::-webkit-scrollbar {
          height: 4px;
        }
        .docs-container::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .docs-container::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
        }
      `}</style>

      {docs.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 docs-container">
          {docs.map((doc) => {
            const isPdf = /\.(pdf)(\?.*)?$/i.test(doc.link);
            return (
              <div
                key={doc.id}
                className="relative aspect-[3/2] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 min-w-[150px] w-[150px]"
              >
                {isPdf ? (
                  <iframe
                    title={`${doc.id} preview`}
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(
                      doc.link
                    )}&embedded=true`}
                    className="h-full w-full"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <img
                    src={doc.link}
                    alt={`${doc.id} preview`}
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="group cursor-pointer absolute right-2 top-2 inline-flex items-center gap-1 rounded-xs bg-black/20 px-1 pt-1 transition hover:bg-black/60">
                    <a
                      href={doc.link}
                      target="_blank"
                      rel="noreferrer"
                      download
                    >
                      <DownloadIcon
                        size={12}
                        className="group-hover:text-gray-300 text-gray-500 mx-auto mb-2"
                      />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileTextIcon
              size={32}
              className="text-gray-300 mx-auto mb-2"
            />
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        )}
    </>
  );
}
