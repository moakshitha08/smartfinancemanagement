import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}

/**
 * Dropdown with built-in "Other" handling: when "Other" is chosen, an inline input appears
 * and its custom value becomes the actual value passed up.
 */
export const CategorySelect = ({ value, onChange, options, placeholder = "Select" }: Props) => {
  const isPreset = options.includes(value) && value !== "Other";
  const [mode, setMode] = useState<"preset" | "other">(isPreset || !value ? "preset" : "other");
  const [other, setOther] = useState(isPreset || !value ? "" : value);

  useEffect(() => {
    if (mode === "other") onChange(other.trim());
  }, [other, mode, onChange]);

  return (
    <div className="space-y-2">
      <Select
        value={mode === "other" ? "Other" : value}
        onValueChange={(v) => {
          if (v === "Other") {
            setMode("other");
            onChange(other.trim());
          } else {
            setMode("preset");
            onChange(v);
          }
        }}
      >
        <SelectTrigger className="bg-secondary/60 border-border">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="z-[60]">
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {mode === "other" && (
        <Input
          autoFocus
          required
          placeholder="Enter custom value"
          value={other}
          onChange={(e) => setOther(e.target.value)}
          className="bg-secondary/60"
        />
      )}
    </div>
  );
};