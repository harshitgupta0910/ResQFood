import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HiArrowRight, HiCheckCircle, HiSparkles, HiLightningBolt, HiGlobeAlt } from 'react-icons/hi';
import { analyticsAPI } from '../services/api';

const compactNumber = (value) => {
  const num = Number(value) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return `${num}`;
};

const flowSteps = [
  {
    title: 'Donors List Surplus',
    detail: 'Restaurants, caterers, and stores post available food in a few clicks.',
  },
  {
    title: 'NGOs Get Matched Fast',
    detail: 'Nearby organizations receive real-time opportunities and claim quickly.',
  },
  {
    title: 'Pickup Gets Tracked',
    detail: 'Transparent status updates improve trust, fairness, and accountability.',
  },
];

const roleHighlights = [
  {
    role: 'For Donors',
    summary: 'Convert surplus into measurable social impact with zero operational chaos.',
    points: ['Quick listing workflow', 'Claim visibility and updates', 'Impact analytics dashboard'],
  },
  {
    role: 'For NGOs',
    summary: 'Get reliable access to food opportunities based on location and urgency.',
    points: ['Live feed of available food', 'Fair claim allocation', 'Pickup and delivery coordination'],
  },
];

const LandingPage = () => {
  const { data } = useQuery({
    queryKey: ['public-analytics-overview'],
    queryFn: analyticsAPI.getPublicOverview,
    staleTime: 1000 * 60,
  });

  const publicStats = data?.data || {};

  const impactStats = [
    { label: 'Meals Redistributed', value: compactNumber(publicStats.mealsRedistributed) },
    { label: 'Active Donors', value: compactNumber(publicStats.activeDonors) },
    { label: 'Partner NGOs', value: compactNumber(publicStats.partnerNgos) },
    { label: 'Claim Success Rate', value: `${Number(publicStats.claimRate || 0)}%` },
  ];

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 overflow-x-hidden">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.12),transparent_35%)]" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-secondary font-black text-lg shadow-[0_12px_30px_-12px_rgba(16,185,129,0.65)]">
              R
            </div>
            <span className="heading-font text-xl font-semibold tracking-tight">ResQFood</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-surface-200 bg-white/75 px-4 py-2 text-sm font-semibold text-surface-900 transition hover:border-primary/40 hover:bg-white"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/90"
            >
              Sign Up
            </Link>
          </div>
        </header>

        <main className="relative mx-auto max-w-7xl px-6 pb-14 pt-10 md:px-10 md:pt-16 lg:pb-20">
          <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-secondary">
                <HiSparkles className="h-4 w-4 text-primary" />
                Food Rescue Network
              </p>

              <h1 className="heading-font text-4xl font-bold leading-tight tracking-tight text-surface-900 sm:text-5xl lg:text-6xl">
                Less Waste.
                <br />
                More Plates Filled.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-surface-900/75 sm:text-lg">
                ResQFood connects food donors and NGOs in real time, helping cities redirect surplus food where it is needed most.
                Build trust, move faster, and measure impact from one platform.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-secondary transition hover:-translate-y-0.5 hover:bg-primary-600 hover:text-white"
                >
                  Start Saving Food
                  <HiArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-surface-200 bg-white px-6 py-3 text-sm font-semibold text-surface-900 transition hover:border-primary/40"
                >
                  I Already Have an Account
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-surface-200 bg-white/85 p-6 shadow-[0_30px_80px_-45px_rgba(6,78,59,0.45)] backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-2">
                {impactStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                    <p className="heading-font text-2xl font-bold text-secondary">{stat.value}</p>
                    <p className="mt-1 text-sm text-surface-900/70">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-surface-200 bg-gradient-to-r from-secondary to-secondary/85 p-4 text-white">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">Live Efficiency Index</p>
                <p className="mt-1 heading-font text-2xl font-bold">
                  {`${Number(publicStats.claimRate || 0)}% Claim-to-Delivery Efficiency`}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-14 grid gap-5 md:grid-cols-3">
            {flowSteps.map((step, idx) => (
              <article key={step.title} className="rounded-3xl border border-surface-200 bg-white p-6 shadow-[0_18px_40px_-30px_rgba(6,78,59,0.4)]">
                <p className="heading-font text-sm font-bold uppercase tracking-wider text-primary">Step {idx + 1}</p>
                <h3 className="mt-2 heading-font text-2xl font-semibold text-surface-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-900/70">{step.detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-14 grid gap-5 lg:grid-cols-2">
            {roleHighlights.map((roleCard) => (
              <article key={roleCard.role} className="rounded-3xl border border-surface-200 bg-white p-7">
                <h3 className="heading-font text-2xl font-semibold text-secondary">{roleCard.role}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-900/70">{roleCard.summary}</p>

                <ul className="mt-4 space-y-2">
                  {roleCard.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-sm text-surface-900/80">
                      <HiCheckCircle className="h-5 w-5 shrink-0 text-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="mt-14 rounded-[2rem] border border-secondary/20 bg-secondary px-6 py-9 text-white md:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                  <HiGlobeAlt className="h-4 w-4" />
                  Ready To Join The Movement
                </p>
                <h2 className="mt-2 heading-font text-3xl font-semibold leading-tight">
                  Create your account and start redistributing surplus food today.
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-secondary transition hover:bg-primary-600 hover:text-white"
                >
                  Sign Up Now
                  <HiArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/35 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Login
                  <HiLightningBolt className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
