export default function WhyPatorbit() {
  return (
    <section className="bg-slate-900 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-4xl font-bold">
          Why Patorbit?
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-center text-lg text-slate-300">
          Traditional platforms store documents. Patorbit organizes knowledge,
          connecting identities, claims, evidence, reasoning, confidence, and
          trust into a unified platform.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-xl font-semibold text-cyan-400">
              Identity
            </h3>
            <p className="mt-4 text-slate-300">
              Build trusted digital identities that evolve over time.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-xl font-semibold text-cyan-400">
              Evidence
            </h3>
            <p className="mt-4 text-slate-300">
              Connect every claim with verifiable evidence and supporting data.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-xl font-semibold text-cyan-400">
              Trust
            </h3>
            <p className="mt-4 text-slate-300">
              Generate explainable trust instead of relying on static documents.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}