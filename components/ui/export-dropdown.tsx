import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface ExportDropdownProps {
  onExport: (type: "pdf" | "csv" | "json") => void;
  trigger: React.ReactNode;
  className?: string;
}

export const ExportDropdown = ({
  onExport,
  trigger,
  className = "",
}: ExportDropdownProps) => {
  const exportOptions = [
    { type: "pdf", label: "PDF" },
    { type: "csv", label: "CSV" },
    { type: "json", label: "JSON" },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={className}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-30 rounded-md shadow-sm bg-card border-none p-2 flex flex-col gap-0.5">
        {exportOptions.map((option, index) => (
          <div key={option.type}>
            <DropdownMenuItem
              onClick={() => onExport(option.type)}
              className="cursor-pointer bg-card p-1 pl-2 body-2-regular text-foreground flex justify-center items-center"
            >
              {option.label}
            </DropdownMenuItem>
            {index < exportOptions.length - 1 && (
              <DropdownMenuSeparator className="bg-grey-50 my-0" />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
