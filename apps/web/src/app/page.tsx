'use client';

import { motion } from 'framer-motion';
import { Sparkles, Shield, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/marketing/header';
import { ServicePhotoCarousel } from '@/components/marketing/service-photo-carousel';
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

  const services = [
    {
      title: t.home.serviceRepairTitle,
      desc: t.home.serviceRepairDesc,
      delayMs: 0,
      slides: [
        { src: '/images/home/ventilation.jpg', alt: t.home.repairPhotoAlt },
        { src: '/images/home/cap-work.jpg', alt: t.home.carePhotoAlt },
        { src: '/images/home/lace-fill.jpg', alt: t.home.laceFillAlt },
        { src: '/images/home/sewing.jpg', alt: t.home.sewingAlt },
      ],
    },
    {
      title: t.home.serviceCareTitle,
      desc: t.home.serviceCareDesc,
      delayMs: 1300,
      slides: [
        { src: '/images/home/coloring.jpg', alt: t.home.colorAlt },
        { src: '/images/home/wash.jpg', alt: t.home.washAlt },
      ],
    },
    {
      title: t.home.serviceDesignTitle,
      desc: t.home.serviceDesignDesc,
      delayMs: 2600,
      slides: [
        { src: '/images/home/workshop.jpg', alt: t.home.workshopAlt },
        { src: '/images/home/coloring.jpg', alt: t.home.colorAlt },
      ],
    },
  ];

  return (
    <>
      <Header />
      <main className="pt-16">
        <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-20 md:pt-28">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blush/40 to-transparent" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              className="text-center lg:text-start"
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
                className="font-display text-4xl leading-tight text-ink sm:text-5xl md:text-6xl lg:text-[4.25rem]"
              >
                {t.home.titleLine1}
                <span className="block text-champagne">{t.home.titleAccent}</span>
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="mx-auto mt-6 max-w-xl text-base text-muted sm:text-lg lg:mx-0"
              >
                {t.home.subtitle}
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start"
              >
                <a href="/register" className="w-full max-w-xs sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full">
                    {t.home.ctaBook}
                  </Button>
                </a>
                <a href="/pro" className="w-full max-w-xs sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full">
                    {t.home.ctaBecomeExpert}
                  </Button>
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] shadow-elevated ring-1 ring-ink/5"
            >
              <Image
                src="/images/home/atelier.jpg"
                alt={t.home.atelierAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover object-[center_42%]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent" />
            </motion.div>
          </div>
        </section>

        <section id="trust" className="border-t border-ink/5 bg-ink px-4 py-16 text-warm-white sm:px-6 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
            {trustItems.map(({ icon: Icon, title, desc }) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[var(--radius-card)] border border-warm-white/10 p-6 sm:p-8"
              >
                <Icon className="mb-4 h-8 w-8 text-champagne" aria-hidden />
                <h3 className="font-display text-xl">{title}</h3>
                <p className="mt-2 text-sm text-warm-white/70">{desc}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="services" className="border-t border-ink/5 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-3xl text-ink sm:text-4xl">
              {t.home.servicesTitle}
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {services.map((item) => (
                <article
                  key={item.title}
                  className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink/5 bg-warm-white shadow-soft"
                >
                  <ServicePhotoCarousel slides={item.slides} delayMs={item.delayMs} />
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted">{item.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">{t.home.howTitle}</h2>
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
      <footer className="border-t border-ink/5 px-4 py-8 text-center text-sm text-muted sm:px-6">
        © {new Date().getFullYear()} {t.brand} · Israel ·{' '}
        <Link href="/cookies" className="text-champagne hover:underline">
          {t.cookies.title}
        </Link>
      </footer>
    </>
  );
}
