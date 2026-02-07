import { ReactNode } from "react";

interface TextProps {
  children: ReactNode;
  size?: "large" | "small";
  weight?: "medium" | "semibold" | "bold" | "extrabold";
  className?: string;
  withBorder?: boolean;
}

const sizeClasses = {
  large: "text-[11.2vw]",
  small: "text-[4.5vw] leading-[1]",
};

const weightClasses: Record<"medium" | "semibold" | "bold" | "extrabold", string> = {
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

export default function Text({
  children,
  size = "large",
  weight = "bold",
  className = "",
}: TextProps) {
  const baseClasses = "text-[var(--text-border-color)] uppercase leading-[0.9]";
  const sizeClass = sizeClasses[size];
  const weightClass = weightClasses[weight];

  return (
    <span className={`block ${baseClasses} ${sizeClass} ${weightClass} ${className}`}>
      {children}
    </span>
  );
}
