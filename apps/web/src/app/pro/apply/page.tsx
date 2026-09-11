'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ServiceTypeDto } from '@velure/contracts';
import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth';
import { useLocale } from '@/lib/i18n/locale';
import { formatStatus } from '@/lib/format';

type TechProfile = {
  id: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  yearsExperience: number | null;
  serviceCity: string | null;
  servicePostalCode: string | null;
  salonAddress: string | null;
  offersHomeService: boolean;
  offersSalonService: boolean;
  latitude: number | null;
  longitude: number | null;
  status: string;
  services: { id: string; name: string }[];
};

export default function ProApplyPage() {
  const { authFetch, user, refreshSession } = useAuth();
  const { t, format } = useLocale();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const isTech = user?.roles?.includes('TECHNICIAN');

  const services = useQuery({
    queryKey: ['services'],
    queryFn: () => authFetch<ServiceTypeDto[]>('/api/v1/services?limit=50'),
  });

  const mine = useQuery({
    queryKey: ['tech-me'],
    queryFn: () => authFetch<TechProfile>('/api/v1/technicians/me'),
    retry: false,
  });

  useEffect(() => {
    if (mine.data?.services) {
      setSelectedServices(mine.data.services.map((s) => s.id));
    }
  }, [mine.data]);

  const apply = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      authFetch<TechProfile>('/api/v1/technicians/apply', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: async (profile) => {
      await refreshSession();
      await queryClient.invalidateQueries({ queryKey: ['tech-me'] });
      if (profile.status === 'APPROVED') {
        window.location.href = '/pro';
        return;
      }
      setOk(t.pro.applyHintEdit);
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : t.pro.applyFailed);
    },
  });

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      authFetch<TechProfile>('/api/v1/technicians/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      setOk(t.pro.updated);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['tech-me'] });
    },
    onError: (err) => {
      setOk(null);
      setError(err instanceof ApiClientError ? err.message : t.pro.updateFailed);
    },
  });

  function buildBody(form: FormData) {
    return {
      displayName: String(form.get('displayName')),
      headline: String(form.get('headline') || '') || undefined,
      bio: String(form.get('bio') || '') || undefined,
      serviceCity: String(form.get('serviceCity')),
      servicePostalCode: String(form.get('servicePostalCode')),
      serviceCountryCode: 'IL',
      salonAddress: String(form.get('salonAddress') || '') || undefined,
      offersHomeService: form.get('offersHome') === 'on',
      offersSalonService: form.get('offersSalon') === 'on',
      serviceTypeIds: selectedServices,
      latitude: Number(form.get('latitude') || mine.data?.latitude || 32.0853),
      longitude: Number(form.get('longitude') || mine.data?.longitude || 34.7818),
      yearsExperience: Number(form.get('yearsExperience') || 1),
    };
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (selectedServices.length === 0) {
      setError(t.pro.needService);
      return;
    }
    const form = new FormData(e.currentTarget);
    const body = buildBody(form);
    if (mine.data) {
      update.mutate(body);
    } else {
      apply.mutate(body);
    }
  }

  const profile = mine.data;
  const pending = apply.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-[#e8b4a2]">
          {profile ? t.pro.applyEdit : t.pro.applyTitle}
        </h1>
        <p className="mt-2 text-white/60">
          {profile
            ? format(t.pro.applyHintEdit, { status: formatStatus(profile.status, t.status) })
            : t.pro.applyHint}
        </p>
      </div>

      {mine.isLoading && isTech ? <p className="text-white/50">{t.pro.loadingProfile}</p> : null}

      {(!isTech || profile || (!mine.isLoading && !mine.isError)) && !(isTech && mine.isLoading) ? (
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">{t.pro.displayName}</label>
              <input
                name="displayName"
                required
                key={`displayName-${profile?.id ?? 'new'}`}
                defaultValue={
                  profile?.displayName ??
                  `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">{t.pro.headline}</label>
              <input
                name="headline"
                key={`headline-${profile?.id ?? 'new'}`}
                defaultValue={profile?.headline ?? ''}
                placeholder={t.pro.headlinePlaceholder}
                className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">{t.pro.city}</label>
              <input
                name="serviceCity"
                required
                key={`city-${profile?.id ?? 'new'}`}
                defaultValue={profile?.serviceCity ?? 'Tel Aviv'}
                className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">{t.pro.postal}</label>
              <input
                name="servicePostalCode"
                required
                key={`postal-${profile?.id ?? 'new'}`}
                defaultValue={profile?.servicePostalCode ?? '6100000'}
                className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">{t.pro.salon}</label>
              <input
                name="salonAddress"
                key={`salon-${profile?.id ?? 'new'}`}
                defaultValue={profile?.salonAddress ?? ''}
                className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">{t.pro.years}</label>
              <input
                name="yearsExperience"
                type="number"
                min={0}
                key={`years-${profile?.id ?? 'new'}`}
                defaultValue={profile?.yearsExperience ?? 3}
                className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/70">{t.pro.bio}</label>
            <textarea
              name="bio"
              rows={3}
              key={`bio-${profile?.id ?? 'new'}`}
              defaultValue={profile?.bio ?? ''}
              className="mt-1 w-full rounded-lg border border-white/10 bg-transparent px-3 py-2"
            />
          </div>

          <div className="flex gap-4 text-sm text-white/70">
            <label className="flex items-center gap-2">
              <input
                name="offersHome"
                type="checkbox"
                key={`home-${profile?.id ?? 'new'}-${profile?.offersHomeService}`}
                defaultChecked={profile?.offersHomeService ?? true}
              />{' '}
              {t.pro.homeOffer}
            </label>
            <label className="flex items-center gap-2">
              <input
                name="offersSalon"
                type="checkbox"
                key={`salonOffer-${profile?.id ?? 'new'}-${profile?.offersSalonService}`}
                defaultChecked={profile?.offersSalonService ?? true}
              />{' '}
              {t.pro.salonOffer}
            </label>
          </div>

          <fieldset>
            <legend className="text-sm text-white/70">{t.pro.offeredServices}</legend>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {services.data?.map((s) => (
                <li key={s.id}>
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s.id)}
                      onChange={() =>
                        setSelectedServices((prev) =>
                          prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                        )
                      }
                    />
                    {s.name}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {ok ? <p className="text-sm text-[#e8b4a2]">{ok}</p> : null}
          <Button type="submit" variant="gold" disabled={pending}>
            {pending
              ? t.job.completing
              : profile
                ? t.pro.applyUpdate
                : t.pro.applySubmit}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
