"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PasswordInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type"
>;

/**
 * A password field with a reveal toggle, so a mistyped password can be checked
 * rather than guessed at.
 *
 * The toggle is a `type="button"`, which keeps Enter on the field submitting the
 * form instead of flipping the text. It stays in the tab order — a keyboard user
 * has the same reason to look.
 */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        // Room for the toggle, so a long password doesn't run under it.
        className={cn("pr-9", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Icon className="size-4" aria-hidden />
      </button>
    </div>
  );
}
