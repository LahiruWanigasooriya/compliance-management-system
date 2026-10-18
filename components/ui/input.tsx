import { forwardRef, useState } from "react";
import { cn } from "../../lib/utils";
import clsx from "clsx";
import { Eye, EyeClosed } from "lucide-react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: boolean;
  error?: string;
  outerClassName?: string;
  className?: string;
  inputContainerClassName?: string;
  labelClassName?: string;
  buttonClassName?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      labelClassName = "",
      type,
      label,
      icon,
      error,
      outerClassName = "",
      inputContainerClassName = "",
      buttonClassName = "",
      ...props
    },
    ref,
  ) => {
    const [show, setShow] = useState(false);

    return (
      <div className={`flex w-full flex-col gap-2 ${outerClassName}`}>
        {label && (
            <label htmlFor="email" className="flex items-center gap-1">
                <span className={`text-sm font-bold ${labelClassName}`}>{label}</span>
            </label>
        )}

        <div className={`relative ${inputContainerClassName}`}>
          <input
            type={type === "password" ? (show ? "text" : "password") : type}
            className={cn(
              `text-sm placeholder:text-gray-500 flex h-12 w-full rounded-md border p-3 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${type === "password" ? "pr-10" : ""}`,
              error ? "border-red-500" : "border-gray-200 focus:border-emerald-600",
              className,
            )}
            ref={ref}
            {...props}
          />
          {icon && (
            <button
              type="button"
              className={clsx("absolute inset-y-0 right-0 flex items-center pr-3 focus:outline-none cursor-pointer", buttonClassName)}
            >
              {show ? (
                <Eye size={20} onClick={() => setShow(!show)}/>
              ) : (
                <EyeClosed size={20} onClick={() => setShow(!show)}/>
              )}
            </button>
          )}
        </div>
        {error && (
          <div
            className={cn(
              "overflow-hidden transition-all duration-1500 ease-in-out",
              error ? "opacity-100" : "opacity-0",
            )}
          >
            <p className="text-sm text-red-500 transition-all duration-1500 ease-in-out">
              {error}
            </p>
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };