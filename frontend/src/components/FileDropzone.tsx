import { useRef, useState } from "react";

type Props = {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
};

const ACCEPTED = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export default function FileDropzone({ onFileSelected, disabled = false }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    const dropped = event.dataTransfer.files?.[0];
    if (dropped && ACCEPTED.includes(dropped.type)) {
      onFileSelected(dropped);
    }
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected && ACCEPTED.includes(selected.type)) {
      onFileSelected(selected);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={[
        "rounded-xl border-2 border-dashed p-6 text-center transition",
        isDragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-white",
        disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
      onClick={() => {
        if (!disabled) {
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />
      <p className="text-slate-700 font-medium">Drag and drop a PDF or image here</p>
      <p className="mt-1 text-sm text-slate-500">or click to choose a file</p>
    </div>
  );
}
