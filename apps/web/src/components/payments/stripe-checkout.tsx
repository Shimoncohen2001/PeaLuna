'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';

const stripeCache = new Map<string, Promise<Stripe | null>>();

function stripePromiseFor(publishableKey: string) {
  let cached = stripeCache.get(publishableKey);
  if (!cached) {
    cached = loadStripe(publishableKey);
    stripeCache.set(publishableKey, cached);
  }
  return cached;
}

export function StripeCheckout({
  clientSecret,
  publishableKey,
  payLabel,
  payingLabel,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  publishableKey: string;
  payLabel: string;
  payingLabel: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const stripePromise = useMemo(() => stripePromiseFor(publishableKey), [publishableKey]);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe', variables: { colorPrimary: '#c4a484' } },
      }}
    >
      <CheckoutForm
        payLabel={payLabel}
        payingLabel={payingLabel}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

function CheckoutForm({
  payLabel,
  payingLabel,
  onSuccess,
  onError,
}: {
  payLabel: string;
  payingLabel: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPending(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: window.location.href,
      },
    });
    setPending(false);
    if (error) {
      onError(error.message ?? 'Payment failed');
      return;
    }
    if (
      paymentIntent &&
      (paymentIntent.status === 'requires_capture' ||
        paymentIntent.status === 'succeeded' ||
        paymentIntent.status === 'processing')
    ) {
      onSuccess();
      return;
    }
    onError('Payment was not completed');
  }

  return (
    <form className="mt-4 space-y-4" onSubmit={onSubmit}>
      <PaymentElement />
      <Button type="submit" variant="primary" disabled={!stripe || pending}>
        {pending ? payingLabel : payLabel}
      </Button>
    </form>
  );
}
