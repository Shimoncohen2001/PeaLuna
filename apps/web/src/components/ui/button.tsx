import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 touch-manipulation focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-warm-white hover:bg-ink/90 shadow-soft',
        secondary:
          'border border-ink/10 bg-warm-white text-ink hover:border-champagne hover:shadow-soft',
        ghost: 'text-ink hover:bg-beige/50',
        gold: 'bg-champagne text-ink hover:bg-champagne-light shadow-soft',
      },
      size: {
        sm: 'h-10 min-h-10 px-4 sm:h-9',
        md: 'h-11 min-h-11 px-5 sm:px-6',
        lg: 'h-12 min-h-12 px-6 text-base sm:px-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
