import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DropdownEditableFieldProps = {
  value: string;
  options: readonly string[];
  onChange: (val: string) => void;
  className?: string;
};

export const DropdownEditableField = ({
  value,
  options,
  onChange,
  className = "",
}: DropdownEditableFieldProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-8 text-sm px-2", className)}>
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="text-sm">
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
