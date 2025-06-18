import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type DropdownEditableFieldProps = {
  value: string;
  options: readonly string[];
  onChange: (val: string) => void;
};

export const DropdownEditableField = ({
  value,
  options,
  onChange,
}: DropdownEditableFieldProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
