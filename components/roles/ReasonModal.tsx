'use client';
import { useState } from 'react';
import { ButtonRbac } from '../ui/ButtonRbac';

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  actionLabel?: string;
}

export const ReasonModal = ({ isOpen, onClose, onConfirm, title, actionLabel = "Confirm" }: ReasonModalProps) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">Please provide a reason for this action (max 100 chars).</p>
        
        <textarea
          className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
          rows={3}
          maxLength={100}
          placeholder="Enter reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <ButtonRbac variant="secondary" onClick={onClose}>Cancel</ButtonRbac>
          <ButtonRbac 
            disabled={!reason.trim()} 
            onClick={() => onConfirm(reason)}
          >
            {actionLabel}
          </ButtonRbac>
        </div>
      </div>
    </div>
  );
};