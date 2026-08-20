import { BrandMark } from "./BrandMark";

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-[380px]">
        <div className="block text-center mb-8">
          <BrandMark />
        </div>
        <div className="bg-cream border border-border rounded-2xl p-8">{children}</div>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  type,
  value,
  onChange,
  placeholder,
  minLength,
  maxLength,
  required = true,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-ink-muted mb-1.5 block">{label}</label>
      <input
        type={type}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-parchment text-sm outline-none focus:border-brand transition-colors"
        placeholder={placeholder}
      />
    </div>
  );
}
