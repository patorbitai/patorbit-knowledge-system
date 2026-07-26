export default function Hero() {
  return (
    <section className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 text-center">
      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm text-cyan-400">
        Trusted Knowledge Platform
      </span>

      <h1 className="mt-8 text-5xl font-extrabold md:text-7xl">
        Build Trust Through
        <span className="block text-cyan-400">Evidence</span>
      </h1>

      <p className="mt-6 max-w-3xl text-lg text-slate-300">
        Patorbit transforms identities, claims, and evidence into trusted,
        explainable knowledge that people and organizations can rely on.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button className="rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-black hover:bg-cyan-400">
          Get Started
        </button>

        <button className="rounded-lg border border-slate-700 px-6 py-3 hover:bg-slate-800">
          Learn More
        </button>
      </div>
    </section>
  );
}