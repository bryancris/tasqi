
interface FormSectionProps {
  children: React.ReactNode;
  title?: string;
}

export function FormSection({ children, title }: FormSectionProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-[#9b87f5]/20 space-y-4">
      {title && <h3 className="text-sm font-medium text-[#8B5CF6]">{title}</h3>}
      {children}
    </div>
  );
}
