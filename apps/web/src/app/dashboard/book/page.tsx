'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ServiceTypeDto, WigDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { formatDistanceKm, formatMoney, intlLocale } from '@/lib/format';
import { BookingMediaStep } from '@/components/booking/booking-media-step';
import type { AddressValue } from '@/components/maps/address-picker';

const ExpertsMap = dynamic(
  () => import('@/components/maps/experts-map').then((m) => m.ExpertsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-xl bg-ink/5 text-sm text-muted">
        …
      </div>
    ),
  },
);

const AddressPicker = dynamic(
  () => import('@/components/maps/address-picker').then((m) => m.AddressPicker),
  { ssr: false },
);

type TechnicianCard = {
  id: string;
  displayName: string;
  headline: string | null;
  serviceCity: string | null;
  servicePostalCode: string | null;
  ratingAvg: number;
  reviewCount: number;
  distanceKm: number | null;
  offersHomeService: boolean;
  offersSalonService: boolean;
  latitude: number | null;
  longitude: number | null;
  services: { id: string; name: string; basePriceCents: number }[];
  skills?: { id: string; name: string }[];
};

type BookingResult = {
  id: string;
  orderNumber: string;
  escrowNote: string;
};

const STEP_KEYS = ['stepServices', 'stepWig', 'stepMedia', 'stepExpert', 'stepSlot', 'stepConfirm'] as const;

export default function BookPage() {
  const { authFetch, isAuthenticated } = useAuth();
  const { t, format, locale } = useLocale();
  const router = useRouter();
  const STEPS = STEP_KEYS.map((key) => t.book[key]);
  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [wigId, setWigId] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  /** GPS is applied only after the user taps "Locate me". */
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [filterByGps, setFilterByGps] = useState(false);
  const [geoHint, setGeoHint] = useState<string | null>(null);
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  const [venueType, setVenueType] = useState<'HOME' | 'SALON'>('HOME');
  const [scheduledAt, setScheduledAt] = useState('');
  const [serviceAddress, setServiceAddress] = useState<AddressValue>({
    label: '',
    city: '',
    postalCode: '',
    lat: null,
    lng: null,
  });
  const [error, setError] = useState<string | null>(null);

  const services = useQuery({
    queryKey: ['services'],
    queryFn: () => authFetch<ServiceTypeDto[]>('/api/v1/services?limit=50'),
  });

  const wigs = useQuery({
    queryKey: ['wigs'],
    queryFn: () => authFetch<WigDto[]>('/api/v1/wigs'),
  });

  useEffect(() => {
    const only = wigs.data?.length === 1 ? wigs.data[0] : undefined;
    if (!wigId && only) {
      setWigId(only.id);
    }
  }, [wigId, wigs.data]);

  const technicians = useQuery({
    queryKey: ['technicians', filterByGps, userLat, userLng, selectedServices[0], venueType],
    enabled: step >= 3 && selectedServices.length > 0,
    queryFn: () => {
      const params = new URLSearchParams({
        venue: venueType,
        limit: '20',
        radiusKm: '80',
      });
      if (selectedServices[0]) params.set('serviceTypeId', selectedServices[0]);
      // Only hard-filter by GPS after the user asks to locate; otherwise list all matching experts.
      if (filterByGps && userLat != null && userLng != null) {
        params.set('latitude', String(userLat));
        params.set('longitude', String(userLng));
      }
      return authFetch<TechnicianCard[]>(`/api/v1/technicians?${params}`);
    },
  });

  const selectedTech = useMemo(
    () => technicians.data?.find((t) => t.id === technicianId) ?? null,
    [technicians.data, technicianId],
  );

  const selectedWig = useMemo(
    () => wigs.data?.find((w) => w.id === wigId) ?? null,
    [wigs.data, wigId],
  );

  const totalCents = useMemo(() => {
    if (!services.data) return 0;
    return services.data
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + s.basePriceCents, 0);
  }, [services.data, selectedServices]);

  const bookKeyRef = useRef(crypto.randomUUID());
  const book = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      authFetch<BookingResult>('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Idempotency-Key': bookKeyRef.current },
        body: JSON.stringify(body),
      }),
    onSuccess: (order) => {
      router.push(`/dashboard/orders/${order.id}`);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.book.bookFailed);
    },
  });

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function next() {
    setError(null);
    if (step === 0 && selectedServices.length === 0) {
      setError(t.book.needService);
      return;
    }
    if (step === 1 && !wigId) {
      setError(t.book.needWig);
      return;
    }
    if (step === 3 && !technicianId) {
      setError(t.book.needExpert);
      return;
    }
    if (step === 4 && !scheduledAt) {
      setError(t.book.needSlot);
      return;
    }
    if (step === 4 && venueType === 'HOME' && !serviceAddress.label.trim()) {
      setError(t.book.needAddress);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function onConfirm(e: FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!technicianId || !scheduledAt || !wigId) return;
    book.mutate({
      technicianId,
      wigId,
      serviceTypeIds: selectedServices,
      scheduledAt: new Date(scheduledAt).toISOString(),
      venueType,
      serviceAddressLine: venueType === 'HOME' ? serviceAddress.label || undefined : undefined,
      servicePostalCode: serviceAddress.postalCode || postalCode || undefined,
      serviceCity: serviceAddress.city || city || undefined,
      serviceLatitude: venueType === 'HOME' ? serviceAddress.lat ?? undefined : undefined,
      serviceLongitude: venueType === 'HOME' ? serviceAddress.lng ?? undefined : undefined,
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-champagne">{t.book.eyebrow}</p>
        <h1 className="font-display text-4xl text-ink">{t.book.title}</h1>
        <p className="mt-2 text-muted">{t.book.subtitle}</p>
      </div>

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 text-sm ${
              i === step
                ? 'bg-ink text-warm-white'
                : i < step
                  ? 'bg-champagne/30 text-ink'
                  : 'bg-beige/50 text-muted'
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {services.data?.map((service) => {
            const checked = selectedServices.includes(service.id);
            return (
              <li key={service.id}>
                <button
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    checked
                      ? 'border-champagne bg-champagne/10'
                      : 'border-ink/5 bg-warm-white hover:border-champagne/40'
                  }`}
                >
                  <span className="block text-xs uppercase tracking-wide text-champagne">
                    {service.category ?? t.book.service}
                  </span>
                  <span className="mt-1 block font-medium text-ink">{service.name}</span>
                  <span className="mt-1 block text-sm text-muted">{service.description}</span>
                  <span className="mt-3 block text-sm text-ink">
                    {formatMoney(service.basePriceCents, service.currency, locale)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4 rounded-xl border border-ink/5 bg-warm-white p-6">
          {(wigs.data?.length ?? 0) === 0 && !wigs.isLoading ? (
            <p className="text-muted">
              {t.book.pickWigFirst}{' '}
              <Link href="/dashboard/wigs" className="text-champagne hover:underline">
                {t.nav.myWigs}
              </Link>
            </p>
          ) : (
            <>
              <label className="text-sm font-medium" htmlFor="wigId">
                {t.book.chooseWig}
              </label>
              <select
                id="wigId"
                value={wigId}
                onChange={(e) => setWigId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
                required
              >
                <option value="">{t.book.choosePlaceholder}</option>
                {wigs.data?.map((wig) => (
                  <option key={wig.id} value={wig.id}>
                    {wig.name}
                    {wig.brand ? ` · ${wig.brand}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted">
                <Link href="/dashboard/wigs" className="text-champagne hover:underline">
                  {t.book.addWigLink}
                </Link>
              </p>
            </>
          )}
        </div>
      ) : null}

      {step === 2 && wigId ? <BookingMediaStep wigId={wigId} onSkip={next} /> : null}
      {step === 2 && !wigId ? (
        <p className="text-muted">
          <Link href="/dashboard/wigs" className="text-champagne hover:underline">
            {t.nav.myWigs}
          </Link>
        </p>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted">{filterByGps ? t.book.nearbyDistance : t.book.nearby}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!navigator.geolocation) {
                  setGeoHint(t.geo.unavailable);
                  return;
                }
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUserLat(pos.coords.latitude);
                    setUserLng(pos.coords.longitude);
                    setFilterByGps(true);
                    setGeoHint(null);
                  },
                  (err) => {
                    setFilterByGps(false);
                    setGeoHint(err.code === err.PERMISSION_DENIED ? t.geo.denied : t.geo.unavailable);
                  },
                  { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
                );
              }}
            >
              {t.book.locateMe}
            </Button>
            <select
              value={venueType}
              onChange={(e) => setVenueType(e.target.value as 'HOME' | 'SALON')}
              className="rounded-lg border border-ink/10 px-3 py-2"
            >
              <option value="HOME">{t.payment.homeVenue}</option>
              <option value="SALON">{t.payment.salonVenue}</option>
            </select>
          </div>
          {geoHint ? <p className="text-sm text-muted">{geoHint}</p> : null}

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <ul className="space-y-3">
              {technicians.isLoading ? <p className="text-muted">{t.common.loading}</p> : null}
              {technicians.data?.map((tech) => (
                <li key={tech.id}>
                  <button
                    type="button"
                    onClick={() => setTechnicianId(tech.id)}
                    className={`w-full rounded-xl border p-4 text-left ${
                      technicianId === tech.id
                        ? 'border-champagne bg-champagne/10'
                        : 'border-ink/5 bg-warm-white hover:border-champagne/40'
                    }`}
                  >
                    <p className="font-medium text-ink">{tech.displayName}</p>
                    <p className="text-sm text-muted">{tech.headline}</p>
                    <p className="mt-2 text-sm text-muted">
                      ★ {tech.ratingAvg.toFixed(1)} ({tech.reviewCount})
                      {formatDistanceKm(tech.distanceKm, format, t.geo)
                        ? ` · ${formatDistanceKm(tech.distanceKm, format, t.geo)}`
                        : null}
                      {tech.serviceCity ? ` · ${tech.serviceCity}` : null}
                    </p>
                    {tech.skills && tech.skills.length > 0 ? (
                      <p className="mt-1 text-xs text-champagne">
                        {tech.skills.map((s) => s.name).join(' · ')}
                      </p>
                    ) : null}
                  </button>
                </li>
              ))}
              {!technicians.isLoading && (technicians.data?.length ?? 0) === 0 ? (
                <p className="text-muted">{t.geo.emptyExperts}</p>
              ) : null}
            </ul>

            <ExpertsMap
              className="h-80 w-full overflow-hidden rounded-xl border border-ink/10 lg:h-full lg:min-h-80"
              center={filterByGps && userLat != null && userLng != null ? [userLat, userLng] : undefined}
              userPosition={
                filterByGps && userLat != null && userLng != null ? [userLat, userLng] : null
              }
              technicians={(technicians.data ?? []).map((t) => ({
                ...t,
                selected: t.id === technicianId,
              }))}
              onSelect={setTechnicianId}
            />
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4 rounded-xl border border-ink/5 bg-warm-white p-6">
          <p className="text-sm text-muted">
            {selectedTech?.displayName} — {venueType === 'HOME' ? t.payment.homeVenue : t.payment.salonVenue}
          </p>
          <div>
            <label className="text-sm font-medium" htmlFor="scheduledAt">
              {t.book.stepSlot}
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
              required
            />
          </div>
          {venueType === 'HOME' ? (
            <div className="space-y-4">
              <AddressPicker
                value={serviceAddress}
                onChange={setServiceAddress}
                authFetch={authFetch}
                labels={{
                  search: t.geo.searchAddress,
                  noResults: t.geo.noResults,
                  pickOnMap: t.geo.pickOnMap,
                  useLocation: t.geo.useLocation,
                  denied: t.geo.denied,
                  unavailable: t.geo.unavailable,
                }}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium" htmlFor="city">
                    {t.book.city}
                  </label>
                  <input
                    id="city"
                    value={serviceAddress.city || city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setServiceAddress((prev) => ({ ...prev, city: e.target.value }));
                    }}
                    className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="postalCode">
                    {t.book.postalCode}
                  </label>
                  <input
                    id="postalCode"
                    value={serviceAddress.postalCode || postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      setServiceAddress((prev) => ({ ...prev, postalCode: e.target.value }));
                    }}
                    className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 5 ? (
        <form onSubmit={onConfirm} className="space-y-4 rounded-xl border border-ink/5 bg-warm-white p-6">
          <h2 className="font-display text-2xl">{t.book.stepConfirm}</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              {t.book.stepWig} : <span className="text-ink">{selectedWig?.name ?? '—'}</span>
            </li>
            <li>
              {t.book.stepExpert} : <span className="text-ink">{selectedTech?.displayName}</span>
            </li>
            <li>
              {t.payment.appointment} :{' '}
              <span className="text-ink">
                {scheduledAt ? new Date(scheduledAt).toLocaleString(intlLocale(locale)) : '—'}
              </span>
            </li>
            <li>
              {t.common.total} : <span className="text-ink">{formatMoney(totalCents, 'ILS', locale)}</span>
            </li>
          </ul>
          <p className="text-sm text-muted">{t.payment.escrowExplain}</p>
          <Button type="submit" variant="primary" disabled={book.isPending}>
            {book.isPending ? '…' : t.book.stepConfirm}
          </Button>
        </form>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex gap-3">
        {step > 0 ? (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            {t.common.back}
          </Button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={next} disabled={step === 1 && (wigs.data?.length ?? 0) === 0}>
            {t.common.continue}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
