import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const MARK = { src: '/images/brand/mark.png', width: 350, height: 400 } as const;
const MARK_ON_DARK = { src: '/images/brand/mark-on-dark.png', width: 350, height: 400 } as const;
const LOCKUP = { src: '/images/brand/lockup.png', width: 875, height: 720 } as const;

export function BrandMark({
  variant = 'mark',
  href,
  onDark = false,
  priority = false,
  className,
}: {
  variant?: 'mark' | 'lockup';
  /** Destination. Pass `null` to render without a link. Defaults to home. */
  href?: string | null;
  onDark?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const asset = variant === 'lockup' ? LOCKUP : onDark ? MARK_ON_DARK : MARK;
  const image = (
    <Image
      src={asset.src}
      alt="PeaLuna"
      width={asset.width}
      height={asset.height}
      priority={priority}
      sizes={variant === 'lockup' ? '176px' : '44px'}
      style={variant === 'lockup' ? { height: 'auto' } : { width: 'auto' }}
      className={cn(
        'select-none',
        variant === 'lockup' ? 'h-auto w-40 sm:w-44' : 'h-10 w-auto sm:h-11',
        className,
      )}
    />
  );

  if (href === null) {
    return image;
  }

  return (
    <Link href={href ?? '/'} aria-label="PeaLuna" className="inline-flex shrink-0 items-center">
      {image}
    </Link>
  );
}
