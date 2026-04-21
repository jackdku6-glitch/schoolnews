
// components/FormField.tsx
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  isTextArea?: boolean;
  type?: string;
  required?: boolean;
}
  
export default function FormField({
  label,
  value,
  onChange,
  placeholder = "",
  isTextArea = false,
  type = "text",
  required = true,
}: FormFieldProps) {
  const baseStyles = 
    "w-full p-3 bg-gray-900 border border-gray-200 rounded text-sm font-medium focus:ring-1 focus:ring-black focus:border-black outline-none transition-all";

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {isTextArea ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={4}
          className={`${baseStyles} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={baseStyles}
        />
      )}
    </div>
  );
}