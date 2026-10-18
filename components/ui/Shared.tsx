// components/ui/Shared.tsx
import React from "react";
import { X } from "lucide-react";

// --- Badge ---
export const Badge = ({
  children,
  color = "blue",
}: {
  children: React.ReactNode;
  color?: "red" | "green" | "blue" | "yellow" | "gray";
}) => {
  const colors = {
    red: "bg-red-100 text-red-800",
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
    gray: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[color]}`}
    >
      {children}
    </span>
  );
};

// --- Drawer ---
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Drawer = ({ isOpen, onClose, title, children }: DrawerProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md h-full bg-white shadow-2xl p-6 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
