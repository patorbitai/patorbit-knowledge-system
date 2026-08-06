import Link from "next/link";

const trustItems = [
  "Secure authentication",
  "Encrypted sessions",
  "Verified Professional Identity",
  "Privacy-first architecture",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070B11] flex">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between p-12 xl:p-16 border-r border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shrink-0">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Patorbit</span>
        </Link>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl xl:text-4xl font-semibold tracking-tight text-white leading-[1.15]">
              Own your Professional<br />Identity.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              A verified digital identity for professionals, students, engineers and recruiters.
            </p>
          </div>

          <ul className="space-y-3">
            {trustItems.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Patorbit. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">Patorbit</span>
        </Link>

        <div className="w-full max-w-[400px]">
          {children}
        </div>

        {/* Mobile trust indicators */}
        <ul className="lg:hidden flex flex-wrap justify-center gap-x-5 gap-y-2 mt-10 max-w-sm">
          {trustItems.map((item) => (
            <li key={item} className="flex items-center gap-1.5 text-xs text-slate-500">
              <svg width="9" height="7" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                <path d="M1 4L3.5 6.5L9 1" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
