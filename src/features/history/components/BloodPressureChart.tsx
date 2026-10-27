import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatInstant } from '@/shared/lib/intl';
import type { VitalsPoint } from '../model/history';

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, end: 84, bottom: 28, start: 40 };
const SERIES = [
  { key: 'systolic', color: 'hsl(var(--chart-1))' },
  { key: 'diastolic', color: 'hsl(var(--chart-2))' },
] as const;

type Reading = VitalsPoint & { systolic: number; diastolic: number };

/**
 * Blood pressure over time (design doctor/03, FR-EMR-12): one mmHg axis, two series with a legend and
 * direct labels on the latest reading, a tooltip per reading and the same numbers as a table.
 */
export function BloodPressureChart({ points, timeZone }: { points: VitalsPoint[]; timeZone: string }) {
  const { t } = useTranslation('history');
  const { language } = useLanguage();
  const [active, setActive] = useState<number | null>(null);
  const readings = points.filter((p): p is Reading => p.systolic !== undefined && p.diastolic !== undefined);
  if (readings.length === 0) return <p className="text-body-sm text-muted-foreground">{t('vitals.noReadings')}</p>;

  const day = (iso: string) => formatInstant(iso, language, timeZone, { day: 'numeric', month: 'short', year: 'numeric' });
  // The axis is left to right in both languages, so its labels stay short enough not to reorder
  const tick = (iso: string) => formatInstant(iso, language, timeZone, { day: 'numeric', month: 'short' });
  const times = readings.map((r) => Date.parse(r.at));
  const [t0, t1] = [Math.min(...times), Math.max(...times)];
  const low = Math.floor((Math.min(...readings.map((r) => r.diastolic)) - 10) / 20) * 20;
  const high = Math.ceil((Math.max(...readings.map((r) => r.systolic)) + 10) / 20) * 20;
  const ticks = Array.from({ length: (high - low) / 20 + 1 }, (_, i) => low + i * 20);
  const plotWidth = WIDTH - PAD.start - PAD.end;
  const x = (time: number) => PAD.start + (t1 === t0 ? plotWidth / 2 : ((time - t0) / (t1 - t0)) * plotWidth);
  const y = (value: number) => PAD.top + (1 - (value - low) / (high - low)) * (HEIGHT - PAD.top - PAD.bottom);
  const last = readings.length - 1;
  const shown = active ?? last;

  return (
    <figure className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-body-sm text-muted-foreground">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
            {t(`vitals.${s.key}`)}
          </span>
        ))}
        <span className="ms-auto text-foreground" aria-live="polite">
          {t('vitals.reading', { date: day(readings[shown].at), systolic: readings[shown].systolic, diastolic: readings[shown].diastolic })}
        </span>
      </div>
      {/* Time runs left to right in both languages, like the printed charts doctors read */}
      <div dir="ltr">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label={t('vitals.chartLabel', { count: readings.length })}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.start} x2={WIDTH - PAD.end} y1={y(tick)} y2={y(tick)} stroke="hsl(var(--border))" strokeDasharray={tick === low ? undefined : '3 4'} />
              <text x={PAD.start - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[11px] tabular-nums">{tick}</text>
            </g>
          ))}
          {[0, last].filter((i, n, all) => all.indexOf(i) === n).map((i) => (
            <text key={i} x={x(times[i])} y={HEIGHT - 8} textAnchor={i === 0 && last > 0 ? 'start' : 'middle'} className="fill-muted-foreground text-[11px]">{tick(readings[i].at)}</text>
          ))}
          {active !== null && <line x1={x(times[active])} x2={x(times[active])} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />}
          {SERIES.map((s) => (
            <g key={s.key}>
              <polyline fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={readings.map((r, i) => `${x(times[i])},${y(r[s.key])}`).join(' ')} />
              {readings.map((r, i) => (
                <circle key={r.at} cx={x(times[i])} cy={y(r[s.key])} r={i === active ? 5 : 4} fill={s.color} stroke="hsl(var(--card))" strokeWidth={2} />
              ))}
              <text x={x(times[last]) + 10} y={y(readings[last][s.key])} dominantBaseline="middle" className="fill-foreground text-[11px] font-semibold tabular-nums">
                {readings[last][s.key]}
              </text>
            </g>
          ))}
          {readings.map((r, i) => {
            const left = i === 0 ? PAD.start : (x(times[i - 1]) + x(times[i])) / 2;
            const right = i === last ? WIDTH - PAD.end : (x(times[i]) + x(times[i + 1])) / 2;
            return (
              <rect
                key={r.at}
                x={left}
                y={PAD.top}
                width={Math.max(8, right - left)}
                height={HEIGHT - PAD.top - PAD.bottom}
                fill="transparent"
                tabIndex={0}
                aria-label={t('vitals.reading', { date: day(r.at), systolic: r.systolic, diastolic: r.diastolic })}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none focus-visible:fill-primary/5"
              />
            );
          })}
        </svg>
      </div>
      <details className="text-body-sm">
        <summary className="cursor-pointer text-primary">{t('vitals.asTable')}</summary>
        <table className="mt-2 w-full text-start">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 text-start font-medium">{t('vitals.date')}</th>
              <th className="py-1 text-start font-medium">{t('vitals.systolic')}</th>
              <th className="py-1 text-start font-medium">{t('vitals.diastolic')}</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => (
              <tr key={r.at} className="border-t border-border tabular-nums">
                <td className="py-1">{day(r.at)}</td>
                <td className="py-1">{r.systolic}</td>
                <td className="py-1">{r.diastolic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
