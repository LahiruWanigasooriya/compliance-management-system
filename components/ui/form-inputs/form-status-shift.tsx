import { Controller } from "react-hook-form"

interface FormStatusShiftProps {
  label?: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  className?: string;
}

const FormStatusShift = ({
  label,
  name, 
  control,
  className = "",
}: FormStatusShiftProps) => {
  const statusOptions = [
    {
      value: "active",
      dotColor: "bg-emerald-500",
      label: "Active"
    }, 
    {
      value: "inactive",
      dotColor: "bg-red-400",
      label: "Inactive"
    },
  ]
  
  return (
    <Controller
        name={name}
        control={control}
        defaultValue="active"
        render={({field}) => (
            <div className="w-full flex flex-col gap-2">
              {label && (
                <label className="font-bold text-base"> {label} </label>
              )}
              <div className={`w-full flex gap-4 ${className}`}>
                  {statusOptions.map((option) => (
                      <button key={option.value} onClick={() => field.onChange(option.value)} className={`w-full h-12 cursor-pointer flex justify-center items-center p-3 rounded-lg border ${field.value === option.value ? "border-emerald-400" : "border-gray-300"}`}>
                          <div className="flex gap-2 items-center">
                              <div className={`w-2 h-2 rounded-full ${option.dotColor}`}/>
                              <p className="text-sm text-gray-500">{option.label}</p>
                          </div>
                      </button>
                  ))}
              </div>
            </div>
        )}
    />
  )
}

export default FormStatusShift
