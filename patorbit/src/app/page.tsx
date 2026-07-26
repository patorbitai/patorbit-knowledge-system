import Navbar from "@/components/layout/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pt-16 text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm text-cyan-400">
            Patorbit Platform
          </span>

          <h1 className="mt-8 text-5xl font-extrabold md:text-7xl">
            Build Trust Through
            <span className="block text-cyan-400">
              Evidence
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg text-slate-300">
            A knowledge platform for trusted digital identities, claims,
            evidence, reasoning, confidence, and trust.
          </p>

          <div className="mt-10 flex gap-4">
            <button className="rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-black hover:bg-cyan-400">
              Get Started
            </button>

            <button className="rounded-lg border border-slate-700 px-6 py-3 hover:bg-slate-800">
              Learn More
            </button>
          </div>
        </section>
      </main>
    </>
  );
}