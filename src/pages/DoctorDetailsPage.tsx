import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { doctorsApi, reviewsApi } from '@/api';
import type { DoctorDetails as DoctorDetailsType, Review } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatFee, parseUtc } from '@/lib/format';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Page } from '@/components/layout/Page';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { UserAvatar } from '@/components/UserAvatar';
import { RatingStars, RatingSummary } from '@/components/Rating';
import { ArrowLeft, Banknote, Briefcase, CalendarPlus, MapPin, MessageSquare, Stethoscope } from 'lucide-react';

export function DoctorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [doctor, setDoctor] = useState<DoctorDetailsType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    doctorsApi
      .getById(Number(id))
      .then((res) => setDoctor(res.data))
      .catch((err) => {
        setDoctor(null);
        // A 404 means "no such doctor"; anything else is a failure worth retrying
        if (!(isAxiosError(err) && err.response?.status === 404)) {
          setLoadError(getApiErrorMessage(err, 'Failed to load this doctor'));
        }
      })
      .finally(() => setLoading(false));
  }, [id, reloadKey]);

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    reviewsApi
      .getDoctorReviews(Number(id), { pageNumber: 1, pageSize: 10 })
      .then((res) => setReviews(res.data))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [id, reloadKey]);

  if (loading) {
    return <LoadingState label="Loading doctor profile…" className="min-h-[60vh]" />;
  }

  if (loadError) {
    return (
      <Page width="narrow">
        <ErrorState title="Couldn’t load this doctor" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      </Page>
    );
  }

  if (!doctor) {
    return (
      <Page width="narrow">
        <EmptyState
          icon={Stethoscope}
          title="Doctor not found"
          description="This profile may have been removed, or the link is incorrect."
          action={<Button asChild variant="outline"><Link to="/doctors">Browse doctors</Link></Button>}
        />
      </Page>
    );
  }

  const facts = [
    { icon: Briefcase, label: 'Experience', value: `${doctor.yearsOfExperience} years` },
    { icon: MapPin, label: 'City', value: doctor.clinicCity || '—' },
    { icon: Banknote, label: 'Consultation', value: formatFee(doctor.consultationFee) },
  ];

  const bookingCard = (
    <Card className="lg:sticky lg:top-24">
      <CardHeader>
        <p className="eyebrow">Consultation fee</p>
        <p className="font-display text-headline-xl tabular-nums">{formatFee(doctor.consultationFee)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {doctor.clinicCity && (
          <p className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2.5 text-body-md text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{doctor.clinicAddress ? `${doctor.clinicAddress}, ${doctor.clinicCity}` : doctor.clinicCity}</span>
          </p>
        )}
        {isAuthenticated && role === 'Patient' ? (
          <Button size="lg" className="w-full" onClick={() => navigate(`/patient/book/${doctor.id}`)}>
            <CalendarPlus aria-hidden="true" /> Book an appointment
          </Button>
        ) : !isAuthenticated ? (
          <>
            <Button size="lg" className="w-full" onClick={() => navigate('/login', { state: { from: `/patient/book/${doctor.id}` } })}>
              <CalendarPlus aria-hidden="true" /> Sign in to book
            </Button>
            <p className="text-center text-body-sm text-muted-foreground">
              New here? <Link to="/register/patient" className="font-semibold text-primary hover:underline">Create a free account</Link>
            </p>
          </>
        ) : (
          <p className="rounded-xl bg-muted px-3 py-2.5 text-body-md text-muted-foreground">Booking is available to patient accounts.</p>
        )}
        <p className="text-body-sm text-muted-foreground">Open slots are shown for the next 14 days. Bookings are confirmed instantly.</p>
      </CardContent>
    </Card>
  );

  return (
    <Page width="wide">
      <Link to="/doctors" className="mb-6 inline-flex items-center gap-1.5 text-label-md text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> All doctors
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8">
          {/* Profile header */}
          <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-card">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <UserAvatar name={doctor.fullName} size="xl" />
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-label-sm uppercase tracking-wider text-primary">
                  {doctor.specialtyName}
                </span>
                <h1 className="mt-2 font-display text-headline-lg sm:text-headline-xl">{doctor.fullName}</h1>
                <div className="mt-1.5">
                  <RatingSummary rating={doctor.averageRating} reviews={doctor.totalReviews} />
                </div>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-lg bg-card text-primary shadow-xs">
                    <f.icon className="size-[1.125rem]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-caption uppercase tracking-wider text-muted-foreground">{f.label}</dt>
                    <dd className="truncate text-title-sm tabular-nums">{f.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          {/* Booking card appears here on small screens so the main action is near the top */}
          <div className="lg:hidden">{bookingCard}</div>

          {doctor.bio && (
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-headline-md">About</h2>
              <p className="mt-3 max-w-prose text-body-lg text-muted-foreground">{doctor.bio}</p>
            </section>
          )}

          <section aria-labelledby="reviews-heading">
            <div className="flex items-end justify-between gap-4">
              <h2 id="reviews-heading" className="font-display text-headline-md">Patient reviews</h2>
              {doctor.totalReviews > 0 && (
                <p className="rounded-full bg-secondary px-2.5 py-0.5 text-label-sm text-secondary-foreground">
                  {doctor.totalReviews} {doctor.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              )}
            </div>
            <div className="mt-4">
              {reviewsLoading ? (
                <LoadingState label="Loading reviews…" className="py-10" />
              ) : reviews.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No reviews yet" description="Reviews appear after patients complete a visit." className="py-10" />
              ) : (
                <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-card shadow-card">
                  {reviews.map((review) => (
                    <li key={review.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={review.patientName} size="sm" />
                          <div>
                            <p className="text-label-md">{review.patientName}</p>
                            <p className="mt-0.5 text-body-sm text-muted-foreground">
                              <time dateTime={parseUtc(review.createdAt).toISOString()}>{format(parseUtc(review.createdAt), 'MMM d, yyyy')}</time>
                            </p>
                          </div>
                        </div>
                        <RatingStars value={review.rating} />
                      </div>
                      {review.comment && <p className="mt-3 text-body-md text-foreground/85">{review.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <aside className="hidden lg:block" aria-label="Book this doctor">{bookingCard}</aside>
      </div>
    </Page>
  );
}
