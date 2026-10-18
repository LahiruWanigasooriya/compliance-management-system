import { forwardRef } from "react";

export type FormTextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  outerClassName?: string;
  className?: string;
  labelClassName?: string; 
}

const FormTextInput = forwardRef<HTMLInputElement, FormTextInputProps>(({
  label, error, className = "", outerClassName = "", labelClassName="", id, ...props
}, ref) => {
  return (
    <div className={`w-full flex flex-col gap-2 ${outerClassName}`}>
        {label && (
            <label
                htmlFor={id}
                className={`text-base font-bold ${labelClassName}`}
            >
                {label}
            </label>
        )}
        <input
            id={id}
            ref={ref}
            className={`text-sm h-12 flex w-full rounded-md border p-3 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50
                ${error ? "border-red-500" : "border-gray-300 focus:border-emerald-600"}
                ${className}`}
            {...props}
        />
        {error && (
            <div
            className={`overflow-hidden transition-all duration-1500 ease-in-out
                ${error ? "opacity-100" : "opacity-0"}`}
            >
                <p className="text-sm text-red-500 transition-all duration-1500 ease-in-out">
                    {error}
                </p>
            </div>
        )}
    </div>
  )
})

FormTextInput.displayName = "FormTextInput";
export {FormTextInput}
