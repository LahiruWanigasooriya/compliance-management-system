'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface ResolutionNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (resolutionNote: string) => void;
  isLoading?: boolean;
}

export const ResolutionNoteDialog = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ResolutionNoteDialogProps) => {
  const [resolutionNote, setResolutionNote] = useState<string>('');

  const handleSubmit = () => {
    if (!resolutionNote.trim()) {
      toast.error('Resolution note is required to close a case');
      return;
    }
    onSubmit(resolutionNote);
    setResolutionNote('');
  };

  const handleClose = () => {
    setResolutionNote('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-lg p-6 border border-panel-border max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Close Case
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Please provide a resolution note to close this case. This is
          required.
        </p>
        <textarea
          value={resolutionNote}
          onChange={(e) => setResolutionNote(e.target.value)}
          placeholder="Enter resolution note..."
          className="w-full px-3 py-2 border border-panel-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground min-h-30 resize-none"
          disabled={isLoading}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-panel-border rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Closing...' : 'Close Case'}
          </button>
        </div>
      </div>
    </div>
  );
};
