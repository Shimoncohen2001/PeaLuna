'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export type ServiceSlide = {
  src: string;
  alt: string;
};

const INTERVAL_MS = 4000;

export function ServicePhotoCarousel({
  slides,
  delayMs = 0,
}: {
  slides: ServiceSlide[];
  delayMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let intervalId: number | undefined;
    const startId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setIndex((current) => (current + 1) % slides.length);
      }, INTERVAL_MS);
    }, delayMs);

    return () => {
      window.clearTimeout(startId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [slides.length, paused, delayMs]);

  const active = slides[index] ?? slides[0];

  return (
    <div
      className="relative aspect-[5/4] overflow-hidden bg-blush"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={i === index ? slide.alt : ''}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover"
          />
        </div>
      ))}
      {slides.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
          {slides.map((slide, i) => (
            <span
              key={slide.src}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === index ? 'bg-champagne' : 'bg-warm-white/70'
              }`}
            />
          ))}
        </div>
      ) : null}
      <span className="sr-only">{active?.alt}</span>
    </div>
  );
}
