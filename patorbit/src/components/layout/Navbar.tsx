export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="text-2xl font-bold text-cyan-400">
          Patorbit
        </div>

        <div className="hidden gap-8 text-sm text-slate-300 md:flex">
          <a href="#" className="hover:text-cyan-400">Home</a>
          <a href="#" className="hover:text-cyan-400">Platform</a>
          <a href="#" className="hover:text-cyan-400">Documentation</a>
          <a href="#" className="hover:text-cyan-400">About</a>
        </div>

        <div className="flex gap-3">
          <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">
            Sign In
          </button>

          <button className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400">
            Get Started
          </button>
        </div>
      </nav>
    </header>
  );
}