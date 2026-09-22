"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

/* Single blog article template.
   Content matches the actual Patorbit product behavior — no fabricated claims. */

const posts: Record<
  string,
  { title: string; date: string; read: string; dek: string; body: React.ReactNode }
> = {
  "why-we-wont-write-experience-you-dont-have": {
    title: "Why we won't write experience you don't have",
    date: "July 15, 2026",
    read: "6 min read",
    dek: "Most AI resume tools will happily add ‘Experienced with Snowflake’ because the job posting mentioned it. Here's why Patorbit refuses to — and what it does instead.",
    body: (
      <>
        <p>Here&apos;s the scenario every job seeker runs into. A posting asks for Snowflake. Your profile doesn&apos;t list Snowflake — you&apos;ve never used it. You ask an AI tool to &ldquo;tailor my resume to this job,&rdquo; and it obliges: suddenly your skills section says <em>Experienced with Snowflake</em>.</p>
        <p>That&apos;s a lie. It might even get you an interview. It will not get you the job, and it damages your credibility the moment someone asks a follow-up question in the first screen.</p>

        <h2>What Patorbit does instead</h2>
        <p>When Patorbit analyzes a job description and finds a skill you don&apos;t have, it treats that as a <strong>gap to report</strong>, not a gap to paper over:</p>
        <ul>
          <li><strong>Missing skill: Snowflake</strong></li>
          <li>We won&apos;t add it to your resume.</li>
          <li>Consider learning it, or gaining relevant experience, before applying.</li>
        </ul>
        <p>Where a match is <em>partial</em> — say you&apos;ve used similar warehouse tooling but not that exact product — Patorbit says that too, precisely. You decide what&apos;s honest to claim.</p>

        <h2>What Patorbit will happily do</h2>
        <p>Truthful tailoring has plenty of room:</p>
        <ul>
          <li><strong>Reorder</strong> your real experience so the most relevant items come first.</li>
          <li><strong>Reframe</strong> existing bullets using the language of the job posting — as long as every fact already appears in your profile.</li>
          <li><strong>Surface</strong> skills you have that map to the posting&apos;s requirements, even when you hadn&apos;t connected them.</li>
          <li><strong>Flag</strong> gaps clearly so you can decide whether to apply, upskill, or pass.</li>
        </ul>

        <h2>You approve everything</h2>
        <p>Every suggested rewrite arrives as a suggestion. It touches nothing until you accept it, and you&apos;ll always see the before and after. The goal isn&apos;t to slow you down — it&apos;s that the resume leaving Patorbit is one you can defend line by line.</p>
        <p>That&apos;s the whole bet: <strong>tailoring without inventing experience</strong>. It&apos;s slower than letting a model make things up. It&apos;s faster than rewriting your resume from scratch, and it doesn&apos;t risk your reputation.</p>
      </>
    ),
  },
  "one-resume-many-jobs": {
    title: "One resume, many jobs: tailoring without rewriting",
    date: "July 10, 2026",
    read: "5 min read",
    dek: "Keep one source of truth for your career, then tailor per application. How structured resume data makes job-by-job customization fast instead of tedious.",
    body: (
      <>
        <p>Most people manage multiple job applications by maintaining multiple copies of their resume — <code>resume_final_v3.docx</code>, <code>resume_dataeng.docx</code>, <code>resume_UPDATED_real.docx</code>. Every edit has to be repeated across copies. Every copy drifts.</p>

        <h2>The source-of-truth model</h2>
        <p>Patorbit separates <strong>your career</strong> from <strong>any single presentation of it</strong>. Your structured profile — roles, bullets, skills, education — is the constant. A resume is a view over that data, configured for a specific purpose.</p>

        <h2>Tailoring becomes a difference, not a rewrite</h2>
        <p>Once the underlying data is structured, customizing for a specific posting stops meaning &ldquo;edit a document for 40 minutes&rdquo; and starts meaning:</p>
        <ul>
          <li>Analyze the job description against your profile.</li>
          <li>Review matched skills, missing skills, and partial matches.</li>
          <li>Accept suggested rephrasings that stay true to your actual experience.</li>
          <li>Export — same A4 layout, same fonts, same pagination, tailored content.</li>
        </ul>

        <h2>Nothing silently changes</h2>
        <p>The tailoring loop never writes to your profile without approval. Your source of truth stays clean; the tailored output is the thing that changes per application. Import works the same way in reverse — upload an existing resume, review the extracted structure, and merge only what you accept.</p>
      </>
    ),
  },
  "claims-evidence-explained": {
    title: "Claims and evidence, explained",
    date: "July 5, 2026",
    read: "7 min read",
    dek: "What it means when we label something ‘user-provided’ versus ‘evidence-backed’ — and why we never call an uploaded file verified employment.",
    body: (
      <>
        <p>Most resume data is an unverified assertion. That&apos;s fine — resumes have always worked that way — but it becomes a problem when a platform starts implying verification it hasn&apos;t done.</p>

        <h2>A claim is a statement</h2>
        <p>When you build a profile in Patorbit, your experience becomes structured claims: <em>I worked at Acme as a Data Engineer from 2022 to 2024.</em> <em>I hold an Azure Data Engineer Associate certification.</em> Each claim starts life as exactly what it is: something you told us.</p>

        <h2>Evidence is proof attached to a claim</h2>
        <p>You can attach supporting material to a claim — a document, a link, a reference. The label then reflects reality:</p>
        <ul>
          <li><strong>User-provided</strong> — you stated it. We&apos;re not asserting anything about it.</li>
          <li><strong>Evidence-backed</strong> — a document supports it. We&apos;ve checked that the document exists and matches the claim, not that an employer confirms it.</li>
        </ul>

        <h2>What we never do</h2>
        <p>Uploading a PDF of a job description is not verification of employment. A claim doesn&apos;t become &ldquo;issuer verified&rdquo; because you attached a file. The trust signal on your profile reflects completeness and support — not a third-party guarantee that hasn&apos;t happened.</p>
        <p>This is deliberately conservative. The moment a platform overstates verification, every genuine verification on it becomes suspect.</p>

        <h2>Why it matters for job seekers</h2>
        <p>An honest label protects you. If everything on your profile is clearly marked by its actual status, nothing you&apos;re asked about in an interview can contradict what you claimed. And as you attach real evidence over time, the profile&apos;s support strengthens on its own.</p>
      </>
    ),
  },
};

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const post = posts[params.slug];

  if (!post) {
    return (
      <main className="min-h-screen bg-slate-950 pt-24">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Article not found</h1>
          <p className="text-slate-400 mb-8">This post doesn&apos;t exist (yet).</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all duration-150 hover:from-amber-400 hover:to-orange-500"
          >
            Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 pt-24">
      <article className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-8">
              <Link href="/blog" className="text-amber-400 hover:underline">
                &larr; Back to Blog
              </Link>
              <span>•</span>
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.read}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              {post.title}
            </h1>
            <p className="text-xl text-slate-400 mb-4">{post.dek}</p>
            <p className="text-sm text-slate-600 mb-12">By the Patorbit team</p>
            <div className="prose prose-lg prose-invert max-w-none">{post.body}</div>
          </motion.div>

          {/* CTA */}
          <div className="mt-16 text-center border-t border-white/10 pt-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl font-bold text-white mb-4">Try it yourself</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                Build a resume, analyze a real job description, and see the gaps reported honestly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/resume-builder"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all duration-150 hover:from-amber-400 hover:to-orange-500 hover:shadow-amber-400/30 hover:scale-[1.02] active:scale-100"
                >
                  Build my resume free
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/free-analysis"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-150 hover:bg-slate-900 hover:border-slate-700 hover:text-white hover:scale-[1.02] active:scale-100"
                >
                  Try a job analysis
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </article>
    </main>
  );
}
