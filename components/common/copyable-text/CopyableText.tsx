"use client";

import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/utils/copyToClipboard";
import { truncateStrings } from "@/utils/format";
import React, { useState } from "react";

interface CopyableTextProps {
  text: string;
  copyIconColor?: string;
  copyCheckIconColor?: string;
  textClassName?: string;
  iconClassName?: string;
  truncate?: boolean;
}

const CopyableText: React.FC<CopyableTextProps> = ({
  text,
  copyIconColor = "#1a5276",
  copyCheckIconColor = "#5aa040",
  textClassName = "",
  iconClassName = "",
  truncate = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    copyToClipboard(text);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <span className={`cursor-pointer ${textClassName}`} onClick={handleClick}>
        {truncate ? truncateStrings(text, 5, 5) : text}
      </span>
      {copied ? (
        <span
          className={`cursor-pointer translate-y-1.5 ${iconClassName}`}
          onClick={handleClick}
        >
          <Check size={16} color={copyCheckIconColor} />
        </span>
      ) : (
        <span
          className={`cursor-pointer translate-y-1.5 ${iconClassName}`}
          onClick={handleClick}
        >
          <Copy size={14} color={copyIconColor} />
        </span>
      )}
    </div>
  );
};

export default CopyableText;
