import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

/** A QR code for `value`, drawn as SVG (works without canvas) in the ink color. */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { data: svg } = useQuery({
    queryKey: ['qr', value],
    queryFn: () => QRCode.toString(value, { type: 'svg', margin: 1, color: { dark: '#13263B', light: '#FFFFFF' } }),
    staleTime: Infinity,
  });

  if (!svg) return <Skeleton className={cn('size-48', className)} />;
  return <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} alt={label} className={cn('size-48 rounded-lg border border-border bg-card p-2', className)} />;
}
