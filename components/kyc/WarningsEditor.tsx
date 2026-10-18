"use client";

import { MinusOutlined } from "@ant-design/icons";
import type { WarningEntry } from "@/utils/kyc/warnings";

type WarningGroupProps = {
  label: string;
  entries: WarningEntry[];
  onChange: (next: WarningEntry[]) => void;
  disabled?: boolean;
};

const emptyEntry = () => ({ key: "", value: "" });

const WarningGroup = ({ label, entries, onChange, disabled }: WarningGroupProps) => {
  const updateEntry = (index: number, patch: Partial<WarningEntry>) => {
    const next = [...entries];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const handleRemove = (index: number) => {
    const next = entries.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.length > 0 ? next : [emptyEntry()]);
  };

  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1 dark:text-slate-400">
        {label}
      </p>
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div key={`${label}-${index}`} className="flex gap-2">
            <input
              value={entry.key}
              onChange={(event) =>
                updateEntry(index, { key: event.target.value })
              }
              className="w-1/3 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-600 dark:border-[#373c4a] dark:bg-[#011613] dark:text-slate-100 dark:focus:ring-slate-400"
              placeholder="key"
              disabled={disabled}
            />
            <input
              value={entry.value}
              onChange={(event) =>
                updateEntry(index, { value: event.target.value })
              }
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-600 dark:border-[#373c4a] dark:bg-[#011613] dark:text-slate-100 dark:focus:ring-slate-400"
              placeholder="value"
              disabled={disabled}
            />
            <button
              type="button"
              className="cursor-pointer px-2 py-1 rounded-lg border border-white text-red-700 text-sm font-medium transition-colors hover:border-red-300 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#373c4a] dark:text-red-300 dark:hover:border-red-700 dark:hover:bg-red-900/30 dark:disabled:opacity-60"
              onClick={() => handleRemove(index)}
              disabled={disabled}
            >
              <MinusOutlined />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-xs font-medium text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
          onClick={() => onChange([...entries, emptyEntry()])}
          disabled={disabled}
        >
          + Add warning
        </button>
      </div>
    </div>
  );
};

type WarningsEditorProps = {
  documentWarnings: WarningEntry[];
  addressWarnings: WarningEntry[];
  faceWarnings: WarningEntry[];
  onDocumentWarningsChange: (next: WarningEntry[]) => void;
  onAddressWarningsChange: (next: WarningEntry[]) => void;
  onFaceWarningsChange: (next: WarningEntry[]) => void;
  duplicateKeyError?: string;
  disabled?: boolean;
};

const WarningsEditor = ({
  documentWarnings,
  addressWarnings,
  faceWarnings,
  onDocumentWarningsChange,
  onAddressWarningsChange,
  onFaceWarningsChange,
  duplicateKeyError,
  disabled,
}: WarningsEditorProps) => {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-slate-400">
        Warnings
      </label>
      <div className="space-y-3">
        <WarningGroup
          label="document"
          entries={documentWarnings}
          onChange={onDocumentWarningsChange}
          disabled={disabled}
        />
        <WarningGroup
          label="address"
          entries={addressWarnings}
          onChange={onAddressWarningsChange}
          disabled={disabled}
        />
        <WarningGroup
          label="face"
          entries={faceWarnings}
          onChange={onFaceWarningsChange}
          disabled={disabled}
        />
      </div>
      {duplicateKeyError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {duplicateKeyError}
        </p>
      )}
    </div>
  );
};

export default WarningsEditor;
