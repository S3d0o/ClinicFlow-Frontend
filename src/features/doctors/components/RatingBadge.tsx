import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatNumber } from '@/shared/lib/intl';

/** "★ 4.9 · 128 reviews". The star is decorative; the rating is read out in words. */
export function RatingBadge({ rating, count }: { rating: number; count: number }) {
  const { t } = useTranslation('doctors');
  const { language } = useLanguage();
  return (
    <span className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground">
      <Star aria-hidden="true" className="size-4 fill-highlight text-highlight" />
      <span className="sr-only">{t('card.rating', { rating })}</span>
      <span aria-hidden="true" className="font-semibold text-foreground">
        {formatNumber(rating, language)}
      </span>
      <span>· {t('card.reviews', { count })}</span>
    </span>
  );
}
