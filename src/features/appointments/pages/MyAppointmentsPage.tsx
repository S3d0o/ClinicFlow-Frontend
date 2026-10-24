import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNow } from '@/shared/lib/use-now';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/states';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { AppointmentCard } from '../components/AppointmentCard';
import { ReviewDialog } from '../components/ReviewDialog';
import { useMyAppointments } from '../hooks/use-appointments';
import type { Appointment } from '../model/appointment';
import { splitUpcomingPast } from '../model/rules';

/** Upcoming and past appointments with what can be done on each (FR-PAT-09). */
export default function MyAppointmentsPage() {
  const { t } = useTranslation('appointments');
  const now = useNow();
  const appointments = useMyAppointments();
  const [reviewing, setReviewing] = useState<Appointment | null>(null);

  if (appointments.isPending) return <LoadingState />;
  if (appointments.isError) return <ErrorState onRetry={() => void appointments.refetch()} />;
  const { upcoming, past } = splitUpcomingPast(appointments.data);

  const list = (items: Appointment[], empty: string) =>
    items.length === 0 ? (
      <EmptyState className="rounded-2xl border border-dashed border-border" title={empty} />
    ) : (
      <ul className="space-y-4">
        {items.map((appointment) => (
          <li key={appointment.id}>
            <AppointmentCard appointment={appointment} now={now} onReview={setReviewing} />
          </li>
        ))}
      </ul>
    );

  return (
    <div className="space-y-5">
      <PageHeader title={t('list.title')} description={t('list.intro')} />
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">{t('list.upcoming', { count: upcoming.length })}</TabsTrigger>
          <TabsTrigger value="past">{t('list.past', { count: past.length })}</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">{list(upcoming, t('list.noUpcoming'))}</TabsContent>
        <TabsContent value="past">{list(past, t('list.noPast'))}</TabsContent>
      </Tabs>

      <section className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-4">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-label-md text-foreground">{t('list.newTitle')}</p>
          <p className="text-body-sm text-muted-foreground">{t('list.newBody')}</p>
        </div>
        <Button asChild size="sm">
          <Link to="/patient/book">{t('list.bookNow')}</Link>
        </Button>
      </section>

      {reviewing && <ReviewDialog appointment={reviewing} onClose={() => setReviewing(null)} />}
    </div>
  );
}
