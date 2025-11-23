type SpinnerProps = {
  className?: string;
};

export default function Spinner({ className = "" }: SpinnerProps) {
  return (
    <div
      className={`h-6 w-6 border-2 border-slate-300 border-t-[var(--color-primary)] rounded-full animate-spin ${className}`}
    />
  );
}
