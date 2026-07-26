const products = [
  {
    title: "Career Passport",
    description:
      "A trusted digital identity that combines your experience, skills, claims, and verified evidence.",
  },
  {
    title: "Recruiter Workspace",
    description:
      "Evaluate candidates using explainable evidence and trusted knowledge instead of only resumes.",
  },
  {
    title: "Enterprise Platform",
    description:
      "Manage organizational knowledge, trust, and verification across teams and departments.",
  },
  {
    title: "Developer APIs",
    description:
      "Integrate Patorbit's knowledge and trust capabilities into your own applications.",
  },
];

export default function Products() {
  return (
    <section className="bg-slate-900 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-4xl font-bold">
          Products Built on Patorbit
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-center text-lg text-slate-300">
          A platform that powers trusted knowledge across individuals,
          organizations, and developers.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {products.map((product) => (
            <div
              key={product.title}
              className="rounded-xl border border-slate-700 bg-slate-800 p-8 transition hover:border-cyan-400"
            >
              <h3 className="text-2xl font-semibold text-cyan-400">
                {product.title}
              </h3>

              <p className="mt-4 text-slate-300">
                {product.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}