import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Read-only star rating with an accessible label. */
export function RatingStars({ value, className, size = 'sm' }: { value: number; className?: string; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'size-3.5' : 'size-4';
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(starSize, i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-border')}
        />
      ))}
    </span>
  );
}

/** Compact "★ 4.8" summary; shows "New" when a doctor has no rating yet. */
export function RatingSummary({ rating, reviews, className }: { rating: number; reviews?: number; className?: string }) {
  if (!rating) {
    return <span className={cn('inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground', className)}>New</span>;
  }
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
      <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="font-semibold tabular-nums">{rating.toFixed(1)}</span>
      <span className="sr-only">out of 5</span>
      {reviews !== undefined && <span className="text-muted-foreground">({reviews} {reviews === 1 ? 'review' : 'reviews'})</span>}
    </span>
  );
}

const ratingLabels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** 1–5 star input as an accessible radio group (arrow keys move between stars). */
export function RatingInput({ value, onChange, name = 'rating' }: { value: number; onChange: (value: number) => void; name?: string }) {
  return (
    <fieldset>
      <legend className="sr-only">Rating</legend>
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className="group cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="sr-only"
            />
            <span className="sr-only">{`${star} star${star > 1 ? 's' : ''}, ${ratingLabels[star - 1]}`}</span>
            <Star
              aria-hidden="true"
              className={cn(
                'size-8 transition-transform group-hover:scale-110',
                star <= value ? 'fill-amber-400 text-amber-400' : 'fill-muted text-border'
              )}
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-center text-sm font-medium text-muted-foreground" aria-hidden="true">
        {ratingLabels[value - 1]}
      </p>
    </fieldset>
  );
}
