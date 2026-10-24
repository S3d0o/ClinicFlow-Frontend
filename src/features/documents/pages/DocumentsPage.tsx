import { useState } from 'react';
import { Camera, Download, FileText, Image, Lock, ShieldCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSession } from '@/features/auth/hooks/use-session';
import { RecordsTabs } from '@/features/records/components/RecordsTabs';
import { ServiceError } from '@/shared/api/service-error';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatDay, formatFileSize, formatInstant } from '@/shared/lib/intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { FileDrop } from '@/shared/ui/FileDrop';
import { FormAlert } from '@/shared/ui/FormAlert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ErrorState, LoadingState } from '@/shared/ui/states';
import { StatusChip } from '@/shared/ui/StatusChip';
import { AddPolicyDialog } from '../components/AddPolicyDialog';
import { useDownloadDocument, useMyDocuments, useMyPolicies, useRemoveDocument, useUploadDocument } from '../hooks/use-documents';
import { checkDocument, DOCUMENT_ACCEPT, type PatientDocument } from '../model/documents';

function DocumentRow({ document }: { document: PatientDocument }) {
  const { t } = useTranslation(['records', 'common']);
  const { language } = useLanguage();
  const download = useDownloadDocument();
  const remove = useRemoveDocument();
  const Icon = document.contentType.startsWith('image/') ? Image : FileText;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p dir="auto" className="truncate text-start text-label-md text-foreground">
          {document.fileName}
        </p>
        <p className="text-caption text-muted-foreground">
          {t('documents.uploaded', { date: formatInstant(document.uploadedAt, language, 'Africa/Cairo', { day: 'numeric', month: 'short', year: 'numeric' }) })} ·{' '}
          {formatFileSize(document.sizeBytes, language)}
        </p>
        {document.sharedWithDoctorName && <p className="text-caption text-primary">{t('documents.shared', { doctor: document.sharedWithDoctorName })}</p>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('documents.download', { name: document.fileName })}
        disabled={download.isPending}
        onClick={() => download.mutate({ documentId: document.id, fileName: document.fileName })}
      >
        <Download />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('documents.remove', { name: document.fileName })} className="text-destructive hover:text-destructive">
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.removeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('documents.removeBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate(document.id, { onSuccess: () => toast.success(t('documents.removed')) })}>
              {t('documents.removeConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

/** Insurance cards and shared documents (design patient/16, FR-PAT-06, FR-INS-03). */
export default function DocumentsPage() {
  const { t } = useTranslation(['records', 'screens']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const { user } = useSession();
  const policies = useMyPolicies();
  const documents = useMyDocuments();
  const upload = useUploadDocument();
  const [adding, setAdding] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = (file: File | null) => {
    if (!file) return;
    const problem = checkDocument(file);
    if (problem) return setUploadError(errorMessage(new ServiceError(problem)));
    setUploadError(null);
    upload.mutate(file, {
      onSuccess: () => toast.success(t('documents.uploadedToast')),
      onError: (err) => setUploadError(errorMessage(err)),
    });
  };

  return (
    <div className="space-y-6">
      <RecordsTabs />
      <PageHeader title={t('screens:documents')} description={t('documents.intro')} />

      <section aria-labelledby="cards-title" className="space-y-3">
        <h2 id="cards-title" className="font-display text-title-sm text-ink">
          {t('documents.cards')}
        </h2>
        {policies.isPending ? (
          <LoadingState className="py-6" />
        ) : policies.isError ? (
          <ErrorState className="py-6" onRetry={() => void policies.refetch()} />
        ) : (
          <ul className="space-y-3">
            {policies.data.map((policy) => (
              <li key={policy.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className="space-y-4 bg-ink p-5 text-ink-foreground">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex items-center gap-2 font-display text-title-sm">
                      <ShieldCheck aria-hidden="true" className="size-5" />
                      {policy.payerName}
                    </p>
                    {policy.isDefault && <span className="rounded-full bg-ink-foreground/15 px-2 py-0.5 text-caption">{t('documents.default')}</span>}
                  </div>
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-caption uppercase text-ink-foreground/70">{t('documents.member')}</dt>
                      <dd dir="auto" className="text-start text-label-md">{policy.holderName}</dd>
                    </div>
                    <div>
                      <dt className="text-caption uppercase text-ink-foreground/70">{t('documents.memberNo')}</dt>
                      <dd className="font-mono text-label-md">
                        <bdi dir="ltr">{policy.memberNo}</bdi>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-body-sm">
                  <div className="space-y-0.5">
                    {policy.planName && <p className="font-medium text-foreground">{policy.planName}</p>}
                    {policy.coveragePercent !== undefined && <p className="text-muted-foreground">{t('documents.coverage', { percent: policy.coveragePercent })}</p>}
                    <p className="text-muted-foreground">{t('documents.validUntil', { date: formatDay(policy.validTo, language, { day: 'numeric', month: 'short', year: 'numeric' }) })}</p>
                  </div>
                  <StatusChip tone={policy.status === 'Verified' ? 'success' : policy.status === 'Expired' ? 'danger' : 'warning'}>
                    {t(`documents.status.${policy.status}`)}
                  </StatusChip>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-input bg-card p-4 text-start transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <Camera className="size-5" />
          </span>
          <span>
            <span className="block text-label-md text-foreground">{t('documents.addCard')}</span>
            <span className="block text-body-sm text-muted-foreground">{t('documents.addCardHint')}</span>
          </span>
        </button>
      </section>

      <section aria-labelledby="docs-title" className="space-y-3">
        <div>
          <h2 id="docs-title" className="font-display text-title-sm text-ink">
            {t('documents.myDocs')}
          </h2>
          <p className="text-body-sm text-muted-foreground">{t('documents.myDocsIntro')}</p>
        </div>
        {uploadError && <FormAlert>{uploadError}</FormAlert>}
        <FileDrop file={null} onChange={uploadFile} accept={DOCUMENT_ACCEPT} hint={t('documents.uploadHint')} aria-label={t('documents.upload')} />
        {documents.isPending ? (
          <LoadingState className="py-6" />
        ) : documents.isError ? (
          <ErrorState className="py-6" onRetry={() => void documents.refetch()} />
        ) : documents.data.length === 0 ? (
          <p className="text-body-md text-muted-foreground">{t('documents.noDocs')}</p>
        ) : (
          <ul className="space-y-2">
            {documents.data.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
          </ul>
        )}
        <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 p-3 text-body-sm text-muted-foreground">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t('documents.privacy')}
        </p>
      </section>

      {adding && <AddPolicyDialog defaultHolder={user?.fullName ?? ''} onClose={() => setAdding(false)} />}
    </div>
  );
}
