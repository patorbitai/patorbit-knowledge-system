import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#070B11] px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
        404
      </p>
      <h1 className="text-3xl font-bold text-white">Page not found</h1>
      <p className="max-w-md text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        Back to home
      </Link>
    </div>
  );
}
