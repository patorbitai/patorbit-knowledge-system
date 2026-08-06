import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070B11] px-4">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
          <span className="text-sm font-bold text-white">P</span>
        </div>
        <span className="text-xl font-semibold tracking-tight text-white">
          Patorbit
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
