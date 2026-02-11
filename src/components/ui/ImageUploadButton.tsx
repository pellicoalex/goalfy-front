import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

type Props = {
  label?: string;
  disabled?: boolean;
  onPick: (file: File) => void;
  accept?: string;
};

export default function ImageUploadButton({
  label = "Carica",
  disabled,
  onPick,
  accept = "image/png,image/jpeg,image/webp",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          onPick(f);
          e.currentTarget.value = "";
        }}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </>
  );
}
