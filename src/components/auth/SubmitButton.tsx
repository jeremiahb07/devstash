"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;

export interface SubmitButtonProps extends ButtonProps {
  /**
   * For forms that submit through `onSubmit` rather than a server action, where
   * `useFormStatus` has nothing to report.
   */
  pending?: boolean;
}

export function SubmitButton({
  pending,
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  const status = useFormStatus();
  const isPending = pending ?? status.pending;

  return (
    <Button type="submit" disabled={disabled || isPending} {...props}>
      {isPending && <LoaderCircle className="animate-spin" />}
      {children}
    </Button>
  );
}
