export default function CoreModel() {
  const steps = [
    "Identity",
    "Claims",
    "Evidence",
    "Reasoning",
    "Confidence",
    "Trust",
  ];

  return (
    <section className="bg-slate-950 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-4xl font-bold">
          The Patorbit Knowledge Model
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-center text-lg text-slate-300">
          Every trusted decision is built from connected knowledge—not isolated
          documents.
        </p>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-4">
              <div className="rounded-xl border border-cyan-500 bg-slate-900 px-6 py-4 text-lg font-semibold">
                {step}
              </div>

              {index < steps.length - 1 && (
                <span className="text-3xl text-cyan-400">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}