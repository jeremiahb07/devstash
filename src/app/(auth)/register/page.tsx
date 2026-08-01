import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <Card>
      <CardContent className="space-y-4">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
