import Link from "next/link";
import { Layers } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" className="flex items-center gap-2 whitespace-nowrap">
        <span className="flex size-8 items-center justify-center rounded-md bg-linear-to-br from-violet-500 to-fuchsia-500 text-white">
          <Layers className="size-4.5" />
        </span>
        <span className="text-xl font-semibold">DevStash</span>
      </Link>
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
