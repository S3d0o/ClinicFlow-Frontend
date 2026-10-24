import type { Review } from '@/features/doctors/model/doctor';

export interface ReviewSeed extends Review {
  doctorId: string;
}

// How many reviews each doctor has; the generator below makes exactly that many.
const COUNTS: Record<string, number> = {
  'doc-ahmed': 128, 'doc-hala': 96, 'doc-tamer': 41, 'doc-mona-k': 94, 'doc-sherif': 82,
  'doc-laila': 145, 'doc-yasmine': 37, 'doc-khaled': 63, 'doc-rania': 71, 'doc-omar-h': 12,
};

const AUTHORS = ['Tarek M.', 'Salma N.', 'Mahmoud A.', 'Nada H.', 'Youssef R.', 'Mariam S.', 'Hany F.', 'Dina K.', 'Amr E.', 'Reem T.', 'Ali G.', 'Heba W.'];

// Reviews are stored as the patient wrote them (R9), so they come in either language
const COMMENTS: (string | undefined)[] = [
  'Explained everything calmly and took the time to answer all my questions.',
  'الدكتور محترم جدًا وشرح لي الحالة بالتفصيل.',
  'On time, clear advice, and the follow-up plan made sense.',
  'المواعيد منضبطة والعيادة نظيفة.',
  'Very thorough examination. I felt listened to.',
  'شكرًا على الاهتمام والمتابعة بعد الكشف.',
  undefined,
  'Waited about 20 minutes past my slot, but the visit itself was excellent.',
  'تشخيص دقيق وعلاج مناسب، أنصح به.',
  'Friendly with my children and very patient.',
  undefined,
  'Good doctor, the reception desk could be faster.',
];

/** A small deterministic random sequence, so the sample data is the same on every load. */
function sequence(seed: string) {
  let state = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

export function reviewsSeed(now: Date): ReviewSeed[] {
  return Object.entries(COUNTS).flatMap(([doctorId, count]) => {
    const random = sequence(doctorId);
    return Array.from({ length: count }, (_, i) => {
      const roll = random();
      const rating = roll < 0.78 ? 5 : roll < 0.93 ? 4 : roll < 0.98 ? 3 : 2;
      const daysAgo = Math.floor(random() * 540) + i;
      return {
        id: `rev-${doctorId}-${i}`,
        doctorId,
        authorName: AUTHORS[Math.floor(random() * AUTHORS.length)],
        rating,
        comment: COMMENTS[Math.floor(random() * COMMENTS.length)],
        createdAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
      };
    });
  });
}
