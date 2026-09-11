'use client';

import { motion } from 'framer-motion';
import { Sparkles, Shield, Truck } from 'lucide-react';
import { Header } from '@/components/marketing/header';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { t } = useLocale();

  const trustItems = [
    { icon: Shield, title: t.home.trustEscrowTitle, desc: t.home.trustEscrowDesc },
    { icon: Truck, title: t.home.trustLogisticsTitle, desc: t.home.trustLogisticsDesc },
    { icon: Sparkles, title: t.home.trustHistoryTitle, desc: t.home.trustHistoryDesc },
  ];

  const steps = [t.home.howStep1, t.home.howStep2, t.home.howStep3, t.home.howStep4];

  return (
    <>
      <Header />
      <main className="pt-16">
        <section className="relative overflow-hidden px-6 pb-24 pt-20 md:pt-32">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blush/40 to-transparent" />
          <motion.div
            className="relative mx-auto max-w-4xl text-center"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.12 }}
          >
            <motion.p
              variants={fadeUp}
              className="mb-4 text-sm uppercase tracking-[0.2em] text-champagne"
            >
              {t.home.eyebrow}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl leading-tight text-ink md:text-7xl"
            >
              {t.home.titleLine1}
              <span className="block text-champagne">{t.home.titleAccent}</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              {t.home.subtitle}
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <a href="/register">
                <Button variant="primary" size="lg">
                  {t.home.ctaBook}
                </Button>
              </a>
              <a href="/pro">
                <Button variant="secondary" size="lg">
                  {t.home.ctaBecomeExpert}
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </section>

        <section id="trust" className="border-t border-ink/5 bg-ink px-6 py-20 text-warm-white">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
            {trustItems.map(({ icon: Icon, title, desc }) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[var(--radius-card)] border border-warm-white/10 p-8"
              >
                <Icon className="mb-4 h-8 w-8 text-champagne" aria-hidden />
                <h3 className="font-display text-xl">{title}</h3>
                <p className="mt-2 text-sm text-warm-white/70">{desc}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-4xl text-ink">{t.home.howTitle}</h2>
            <ol className="mt-12 space-y-8 text-left rtl:text-right">
              {steps.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-champagne/20 font-display text-champagne">
                    {i + 1}
                  </span>
                  <p className="pt-2 text-muted">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <footer className="border-t border-ink/5 px-6 py-8 text-center text-sm text-muted">
        © {new Date().getFullYear()} {t.brand} · Israel
      </footer>
    </>
  );
}
