'use client';

import Link from 'next/link';

import { useAuth } from '@/lib/auth/auth-provider';

// ── Section Components ──────────────────────────────────────────────────────

function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Patorbit
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 transition-opacity"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/sign-up"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-4 pt-24 pb-16 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border bg-muted/50 text-xs font-medium text-muted-foreground">
        🚀 Your career, powered by AI
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
        Build Your Career
        <br />
        <span className="text-primary">with Confidence</span>
      </h1>
      <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Patorbit helps you track, verify, and showcase your professional journey. Create AI-powered
        resumes, gather verified claims, and present your career passport to the world.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/sign-up"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Start Building Free
        </Link>
        <Link
          href="#features"
          className="border px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
        >
          See Features
        </Link>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">No credit card required</p>
    </section>
  );
}

// ── Features ────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI Resume Builder',
    description:
      'Generate tailored resumes with AI assistance. Choose from templates, import existing files, and fine-tune every section.',
  },
  {
    icon: '🛂',
    title: 'Career Passport',
    description:
      'A verifiable, versioned snapshot of your entire career profile. Share it securely with employers and recruiters.',
  },
  {
    icon: '◎',
    title: 'Verified Claims',
    description:
      'Add evidence-backed claims to your profile. Attach files, get verifications, and build trust with confidence scores.',
  },
  {
    icon: '🔗',
    title: 'Knowledge Graph',
    description:
      'Map your skills, experience, and education as a connected graph. Discover gaps and opportunities visually.',
  },
  {
    icon: '📊',
    title: 'Trust Analytics',
    description:
      'Track your confidence and trust scores across claims and evidence. Data-driven insight into your professional profile.',
  },
  {
    icon: '👥',
    title: 'Organizations',
    description:
      'Manage team profiles, workspaces, and subscriptions. Perfect for career coaches, recruiters, and enterprises.',
  },
];

function Features() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          From AI-powered resume generation to verifiable career claims — Patorbit is the complete
          platform for career intelligence.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">{f.icon}</span>
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── How It Works ────────────────────────────────────────────────────────────

const STEPS = [
  {
    step: '1',
    title: 'Create Your Profile',
    description: 'Sign up and build your professional profile with name, headline, and summary.',
  },
  {
    step: '2',
    title: 'Add Claims & Evidence',
    description: 'Document your career achievements with evidence files, verifications, and tags.',
  },
  {
    step: '3',
    title: 'Build Your Resume',
    description:
      'Use the AI-powered builder to create resumes from your profile data and templates.',
  },
  {
    step: '4',
    title: 'Share Your Passport',
    description: 'Publish your career passport and share a verifiable link with employers.',
  },
];

function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-24 bg-muted/30 rounded-t-3xl rounded-b-3xl">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Get started in minutes. Build your career profile, add evidence, and generate professional
          resumes — all in one place.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {STEPS.map((s) => (
          <div key={s.step} className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
              {s.step}
            </div>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── CTA ─────────────────────────────────────────────────────────────────────

function Cta() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-24 text-center">
      <h2 className="text-3xl font-bold tracking-tight">Ready to take control of your career?</h2>
      <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
        Join Patorbit and start building a verified, AI-powered career portfolio that opens doors.
      </p>
      <div className="mt-8">
        <Link
          href="/sign-up"
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity inline-block"
        >
          Get Started Free
        </Link>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold text-lg">Patorbit</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Career intelligence platform powered by AI.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="#features" className="hover:text-foreground transition-colors">
                Features
              </Link>
            </li>
            <li>
              <Link href="/sign-up" className="hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </li>
            <li>
              <Link href="/sign-in" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="cursor-default">Privacy Policy</span>
            </li>
            <li>
              <span className="cursor-default">Terms of Service</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Patorbit. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
