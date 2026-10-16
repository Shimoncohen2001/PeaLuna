'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { careLabel, careUi } from '@/lib/i18n/care';
import { catalogServiceName } from '@/lib/i18n/catalog';
import { useLocale } from '@/lib/i18n/locale';
import { formatMoney, formatStatus, intlLocale } from '@/lib/format';
import type { Locale } from '@/lib/i18n/messages';

type AdminCustomerDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  countryCode: string;
  locale: string;
  createdAt: string;
  emailVerifiedAt: string | null;
  roles: string[];
  providers: string[];
  summary: {
    bookings: number;
    cancelled: number;
    pending: number;
    confirmed: number;
    completed: number;
    spentCents: number;
    paidCount: number;
    averageBasketCents: number;
    lastBookingAt: string | null;
    currency: string;
  };
  experts: Array<{ id: string; name: string; bookings: number; spentCents: number }>;
  bookings: Array<{
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    totalCents: number;
    currency: string;
    createdAt: string;
    scheduledAt: string | null;
    completedAt: string | null;
    venueType: string | null;
    serviceCity: string | null;
    expertName: string | null;
    wigName: string | null;
    services: Array<{ slug: string; name: string }>;
    photos: CarePhoto[];
    care: {
      status: string;
      submittedAt: string | null;
      operations: string[];
      beforeCondition: string | null;
      afterCondition: string | null;
      nextCareAt: string | null;
    } | null;
  }>;
  transactions: Array<{
    id: string;
    orderNumber: string;
    type: string;
    status: string;
    amountCents: number;
    currency: string;
    createdAt: string;
  }>;
  wigs: Array<{
    id: string;
    name: string;
    reference: string;
    brand: string | null;
    color: string | null;
    fiberType: string | null;
    lengthCm: number | null;
    currentCondition: string | null;
    lastCareAt: string | null;
    lastTechnicianName: string | null;
    archivedAt: string | null;
    bookings: number;
  }>;
};

type CarePhoto = {
  id: string;
  phase: 'BEFORE' | 'AFTER';
  angle: string | null;
  kind: 'image' | 'video';
  url: string;
};

const PHOTO_ANGLES = ['FRONT', 'BACK', 'LEFT', 'RIGHT', 'LACE'] as const;

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { authFetch } = useAuth();
  const { t, locale } = useLocale();
  const copy = t.admin.customersPage;
  const dateLocale = intlLocale(locale);
  const care = careUi(locale);
  const [preview, setPreview] = useState<CarePhoto | null>(null);

  const dossier = useQuery({
    queryKey: ['admin-customer', params.id],
    queryFn: () => authFetch<AdminCustomerDetail>(`/api/v1/admin/customers/${params.id}`),
    enabled: Boolean(params.id),
  });

  if (dossier.isLoading) {
    return <p className="text-muted">{t.common.loading}</p>;
  }

  if (dossier.isError) {
    const message =
      dossier.error instanceof ApiClientError && dossier.error.status === 404
        ? copy.notFound
        : dossier.error instanceof ApiClientError
          ? dossier.error.message
          : t.admin.overview.loadFailed;
    return (
      <div className="space-y-4">
        <BackLink label={copy.backToList} />
        <p className="text-sm text-red-700">{message}</p>
      </div>
    );
  }

  const data = dossier.data;
  if (!data) return null;

  const flags = [
    data.roles.includes('TECHNICIAN') ? copy.alsoExpert : null,
    data.roles.includes('ADMIN') || data.roles.includes('SUPER_ADMIN') ? copy.alsoAdmin : null,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div>
        <BackLink label={copy.backToList} />
        <p className="mt-4 text-sm uppercase tracking-[0.2em] text-champagne">{t.nav.admin}</p>
        <h1 className="font-display text-4xl text-ink">{data.name || data.email}</h1>
        <p className="mt-2 text-muted">
          {[
            statusLabel(data.status, copy),
            data.emailVerifiedAt ? copy.verified : copy.unverified,
            ...flags,
            data.providers.includes('google') ? copy.googleAccount : null,
            data.providers.includes('password') ? copy.passwordAccount : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={copy.bookings} value={String(data.summary.bookings)} />
        <Stat
          label={copy.spent}
          value={formatMoney(data.summary.spentCents, data.summary.currency, locale)}
          hint={
            data.summary.paidCount
              ? `${copy.average}: ${formatMoney(data.summary.averageBasketCents, data.summary.currency, locale)}`
              : undefined
          }
        />
        <Stat label={copy.completed} value={String(data.summary.completed)} />
        <Stat label={copy.cancelled} value={String(data.summary.cancelled)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
          <h2 className="font-display text-2xl text-ink">{copy.profile}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label={t.auth.email} value={data.email} />
            <Row label={copy.phone} value={data.phone || copy.noPhone} />
            <Row
              label={copy.signupDate}
              value={new Date(data.createdAt).toLocaleString(dateLocale)}
            />
            <Row label={copy.country} value={data.countryCode} />
            <Row label={copy.language} value={data.locale} />
          </dl>
        </article>

        <article className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
          <h2 className="font-display text-2xl text-ink">{copy.summary}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Row label={copy.pending} value={String(data.summary.pending)} />
            <Row label={copy.confirmed} value={String(data.summary.confirmed)} />
            <Row label={copy.completed} value={String(data.summary.completed)} />
            <Row label={copy.cancelled} value={String(data.summary.cancelled)} />
            <Row label={copy.paid} value={String(data.summary.paidCount)} />
            <Row
              label={copy.lastBooking}
              value={
                data.summary.lastBookingAt
                  ? new Date(data.summary.lastBookingAt).toLocaleDateString(dateLocale)
                  : '—'
              }
            />
          </dl>
        </article>
      </section>

      <section className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
        <h2 className="font-display text-2xl text-ink">{copy.experts}</h2>
        {data.experts.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{copy.expertsEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5">
            {data.experts.map((expert) => (
              <li key={expert.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <p className="font-medium text-ink">{expert.name}</p>
                <p className="text-sm text-muted">
                  {copy.bookings}: {expert.bookings}
                  {' · '}
                  {formatMoney(expert.spentCents, data.summary.currency, locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
        <h2 className="font-display text-2xl text-ink">{copy.photos}</h2>
        {data.bookings.every((booking) => booking.photos.length === 0) ? (
          <p className="mt-4 text-sm text-muted">{copy.photosEmpty}</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {data.bookings
              .filter((booking) => booking.photos.length > 0)
              .map((booking) => (
                <li key={`photos-${booking.id}`}>
                  <p className="text-sm font-medium text-ink">
                    {booking.orderNumber}
                    {booking.wigName ? ` · ${booking.wigName}` : ''}
                    {booking.expertName ? ` · ${booking.expertName}` : ''}
                  </p>
                  <CarePhotoGrid
                    photos={booking.photos}
                    locale={locale}
                    beforeLabel={care.before}
                    afterLabel={care.after}
                    extraLabel={care.extra}
                    onOpen={setPreview}
                  />
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
        <h2 className="font-display text-2xl text-ink">{copy.history}</h2>
        {data.bookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{copy.historyEmpty}</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5">
            {data.bookings.map((booking) => (
              <li key={booking.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{booking.orderNumber}</p>
                    <p className="text-sm text-muted">
                      {formatStatus(booking.status, t.status)}
                      {' · '}
                      {formatStatus(booking.paymentStatus, t.status)}
                      {booking.paymentMethod === 'CASH' ? ` · ${t.cash.payCash}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {[
                        booking.expertName,
                        booking.wigName,
                        booking.venueType === 'HOME'
                          ? t.payment.homeVenue
                          : booking.venueType === 'SALON'
                            ? t.payment.salonVenue
                            : null,
                        booking.serviceCity,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {booking.services.length > 0 ? (
                      <p className="mt-1 text-xs text-muted">
                        {booking.services
                          .map((service) => catalogServiceName(locale, service.slug, service.name))
                          .join(' · ')}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted">
                      {new Date(booking.scheduledAt ?? booking.createdAt).toLocaleString(dateLocale)}
                    </p>
                  </div>
                  <p className="text-sm text-champagne">
                    {formatMoney(booking.totalCents, booking.currency, locale)}
                  </p>
                </div>
                {booking.care ? (
                  <div className="mt-3 rounded-xl bg-beige/40 px-4 py-3 text-sm">
                    <p className="font-medium text-ink">
                      {copy.care}
                      {booking.care.submittedAt ? '' : ` · ${formatStatus(booking.care.status)}`}
                    </p>
                    {booking.care.operations.length > 0 ? (
                      <p className="mt-1 text-muted">
                        {booking.care.operations.map((code) => careLabel(locale, code)).join(' · ')}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted">
                      {[
                        booking.care.beforeCondition
                          ? `${care.before}: ${careLabel(locale, booking.care.beforeCondition)}`
                          : null,
                        booking.care.afterCondition
                          ? `${care.after}: ${careLabel(locale, booking.care.afterCondition)}`
                          : null,
                        booking.care.nextCareAt
                          ? `${copy.nextCare}: ${new Date(booking.care.nextCareAt).toLocaleDateString(dateLocale)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {booking.photos.length > 0 ? (
                      <CarePhotoGrid
                        photos={booking.photos}
                        locale={locale}
                        beforeLabel={care.before}
                        afterLabel={care.after}
                        extraLabel={care.extra}
                        onOpen={setPreview}
                      />
                    ) : null}
                  </div>
                ) : booking.photos.length > 0 ? (
                  <div className="mt-3 rounded-xl bg-beige/40 px-4 py-3 text-sm">
                    <p className="font-medium text-ink">{copy.photos}</p>
                    <CarePhotoGrid
                      photos={booking.photos}
                      locale={locale}
                      beforeLabel={care.before}
                      afterLabel={care.after}
                      extraLabel={care.extra}
                      onOpen={setPreview}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
          <h2 className="font-display text-2xl text-ink">{copy.wigs}</h2>
          {data.wigs.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{copy.wigsEmpty}</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/5">
              {data.wigs.map((wig) => (
                <li key={wig.id} className="py-3">
                  <p className="font-medium text-ink">
                    {wig.name}
                    {wig.archivedAt ? ` · ${copy.archived}` : ''}
                  </p>
                  <p className="text-sm text-muted">
                    {wig.reference}
                    {[wig.brand, wig.color, wig.fiberType, wig.lengthCm ? `${wig.lengthCm} cm` : null]
                      .filter(Boolean)
                      .map((part) => ` · ${part}`)
                      .join('')}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {copy.bookings}: {wig.bookings}
                    {wig.currentCondition ? ` · ${careLabel(locale, wig.currentCondition)}` : ''}
                    {wig.lastTechnicianName ? ` · ${wig.lastTechnicianName}` : ''}
                    {wig.lastCareAt
                      ? ` · ${new Date(wig.lastCareAt).toLocaleDateString(dateLocale)}`
                      : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
          <h2 className="font-display text-2xl text-ink">{copy.transactions}</h2>
          {data.transactions.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{copy.transactionsEmpty}</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/5">
              {data.transactions.map((transaction) => (
                <li key={transaction.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm text-ink">{transaction.orderNumber}</p>
                    <p className="text-xs text-muted">
                      {formatStatus(transaction.type)} · {formatStatus(transaction.status)}
                      {' · '}
                      {new Date(transaction.createdAt).toLocaleString(dateLocale)}
                    </p>
                  </div>
                  <p className="text-sm text-champagne">
                    {formatMoney(transaction.amountCents, transaction.currency, locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {preview ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
          onClick={() => setPreview(null)}
          aria-label={t.nav.closeMenu}
        >
          {preview.kind === 'video' ? (
            <video src={preview.url} className="max-h-full max-w-full rounded-lg" controls autoPlay />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
          )}
        </button>
      ) : null}
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link href="/admin/customers" className="text-sm text-champagne hover:underline">
      <span className="inline-block rtl:rotate-180">←</span> {label}
    </Link>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-ink/5 bg-warm-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}

function statusLabel(
  status: string,
  copy: { statusActive: string; statusPending: string; statusSuspended: string },
) {
  if (status === 'ACTIVE') return copy.statusActive;
  if (status === 'PENDING_VERIFICATION') return copy.statusPending;
  if (status === 'SUSPENDED') return copy.statusSuspended;
  return formatStatus(status);
}

function CarePhotoGrid({
  photos,
  locale,
  beforeLabel,
  afterLabel,
  extraLabel,
  onOpen,
}: {
  photos: CarePhoto[];
  locale: Locale;
  beforeLabel: string;
  afterLabel: string;
  extraLabel: string;
  onOpen: (photo: CarePhoto) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {PHOTO_ANGLES.map((angle) => {
        const before = photos.find((photo) => photo.phase === 'BEFORE' && photo.angle === angle);
        const after = photos.find((photo) => photo.phase === 'AFTER' && photo.angle === angle);
        if (!before && !after) return null;
        return (
          <div key={angle}>
            <p className="mb-1 text-xs text-muted">
              {careLabel(locale, angle)} · {beforeLabel} / {afterLabel}
            </p>
            <div className="grid grid-cols-2 gap-1">
              <PhotoThumb photo={before} onOpen={onOpen} />
              <PhotoThumb photo={after} onOpen={onOpen} />
            </div>
          </div>
        );
      })}
      {photos
        .filter(
          (photo) =>
            photo.angle === 'EXTRA' ||
            !photo.angle ||
            !PHOTO_ANGLES.includes(photo.angle as (typeof PHOTO_ANGLES)[number]),
        )
        .map((photo) => (
          <div key={photo.id}>
            <p className="mb-1 text-xs text-muted">
              {photo.phase === 'BEFORE' ? beforeLabel : afterLabel}
              {photo.angle === 'EXTRA' ? ` · ${extraLabel}` : ''}
            </p>
            <PhotoThumb photo={photo} onOpen={onOpen} tall />
          </div>
        ))}
    </div>
  );
}

function PhotoThumb({
  photo,
  onOpen,
  tall,
}: {
  photo?: CarePhoto;
  onOpen: (photo: CarePhoto) => void;
  tall?: boolean;
}) {
  if (!photo) {
    return <div className={tall ? 'h-28 rounded bg-ink/5' : 'h-20 rounded bg-ink/5'} />;
  }
  if (photo.kind === 'video') {
    return (
      <button type="button" onClick={() => onOpen(photo)} className="block w-full overflow-hidden rounded">
        <video src={photo.url} className={tall ? 'h-28 w-full object-cover' : 'h-20 w-full object-cover'} muted />
      </button>
    );
  }
  return (
    <button type="button" onClick={() => onOpen(photo)} className="block w-full overflow-hidden rounded">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="" className={tall ? 'h-28 w-full object-cover' : 'h-20 w-full object-cover'} />
    </button>
  );
}
