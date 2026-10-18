import React from "react";

export const Badge = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning";
}) => {
  const styles = {
    default: "bg-slate-100 text-slate-800",
    success: "bg-emerald-100 text-emerald-800",
    danger: "bg-red-100 text-red-800",
    warning: "bg-amber-100 text-amber-800",
  };
  return (
    <button
  type="button"
  className={`w-20 h-7 flex items-center justify-center rounded-full text-xs font-medium ${styles[variant]}`}
>
  {children}
</button>

  );
};
