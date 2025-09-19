import { InputHTMLAttributes } from "react";
import { cn } from "../utils";

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ className, label, ...props }: Props) {
  return (
    <label className="block">
      {label && <span className="block text-sm text-gray-600 dark:text-gray-300 mb-1">{label}</span>}
      <input className={cn("w-full bg-white dark:bg-black border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 outline-none placeholder:text-gray-400", className)} {...props} />
    </label>
  );
}
