import { Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import { ArrowDown } from "lucide-react";

interface FormSelectProps<T> {
  label?: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  placeholderValue: string;
  selectTypes: T[];
  getOptionLabel: (option: T) => string;
  getOptionKey: (option: T) => string;
  getOptionValue: (option: T) => string;
  disabled?: boolean;
  className?: string;
}

const FormSelect = <T,>({
  label,
  name,
  control,
  placeholderValue = "",
  selectTypes,
  getOptionLabel,
  getOptionKey,
  getOptionValue,
  disabled = false,
  className,    
}: FormSelectProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({field, fieldState}) => (
        <div className="w-full flex flex-col gap-2">
            {label && (
                <label className="text-base font-bold">
                    {label}
                </label>
            )}
            <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                <SelectTrigger icon={<ArrowDown className="w-5 h-5 text-gray-500" />} className={`${fieldState.error ? "border-red-500!" : "border-gray-300! text-gray-500"} ${className}`}>
                  <SelectValue placeholder={placeholderValue} />
                </SelectTrigger>
                <SelectContent>
                  {selectTypes.map((option) => (
                      <SelectItem key={getOptionKey(option)} value={getOptionValue(option)}>
                          {getOptionLabel(option)}
                      </SelectItem>
                  ))}
                </SelectContent>
            </Select>
            {fieldState.error?.message && (
                <p className="text-sm text-red-500">{fieldState.error.message}</p>
            )}
        </div>
      )}
    />
  )
}

export default FormSelect
