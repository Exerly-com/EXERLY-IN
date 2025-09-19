import { ButtonHTMLAttributes } from "react";
import { cn } from "../utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  const base = "rounded-2xl font-medium focus:outline-none transition shadow-soft border";
  const variants = {
    primary: "bg-brand-blue text-white hover:opacity-90 border-brand-blue",
    secondary: cn(
      "bg-white text-black hover:bg-black hover:text-brand-blue",
      "dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-brand-blue"
    ),
    ghost: "bg-transparent text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
  };
  const sizes = { sm: "px-3 py-2 text-sm", md: "px-4 py-2.5", lg: "px-6 py-3 text-lg" };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
