import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Specialty } from '@/features/catalog/model/catalog';
import { nameIn } from '@/shared/i18n/bilingual';
import { useLanguage } from '@/shared/i18n/use-language';
import { useErrorMessage } from '@/shared/i18n/use-messages';
import { formatFileSize } from '@/shared/lib/intl';
import { Button } from '@/shared/ui/button';
import { FormAlert } from '@/shared/ui/FormAlert';
import { useOpenApplicationFile } from '../hooks/use-application';
import type { DoctorApplication } from '../model/application';

/** What the applicant sent: details, contact, documents and the cover letter. */
export function ApplicationSnapshot({ application, specialty }: { application: DoctorApplication; specialty?: Specialty }) {
  const { t } = useTranslation(['recruitment', 'doctors']);
  const { language } = useLanguage();
  const errorMessage = useErrorMessage();
  const openFile = useOpenApplicationFile();
  const files = [application.cv, application.coverLetter].filter((f) => f !== undefined);

  return (
    <section aria-labelledby="snapshot-title" className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 id="snapshot-title" className="font-display text-title-sm text-ink">
        {t('mine.snapshot')}
      </h2>
      <dl className="space-y-3 text-body-md">
        <div>
          <dt className="text-caption text-muted-foreground">{t('mine.name')}</dt>
          <dd dir="auto" className="text-start font-medium text-foreground">{application.applicantName}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted-foreground">{t('mine.specialty')}</dt>
          <dd className="text-foreground">{specialty ? nameIn(specialty, language) : ''}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted-foreground">{t('mine.experience')}</dt>
          <dd className="text-foreground">{t('doctors:profile.years', { count: application.yearsOfExperience })}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted-foreground">{t('mine.contact')}</dt>
          <dd dir="ltr" className="text-start text-foreground">
            {application.phone}
            <br />
            {application.email}
          </dd>
        </div>
      </dl>

      <div className="space-y-2 border-t border-border pt-4">
        <h3 className="text-label-md text-foreground">{t('mine.documents')}</h3>
        {openFile.isError && <FormAlert>{errorMessage(openFile.error)}</FormAlert>}
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
              <FileText aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span dir="ltr" className="block truncate text-start text-label-md text-foreground">
                  {file.fileName}
                </span>
                <span className="text-caption text-muted-foreground">{formatFileSize(file.sizeBytes, language)}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => openFile.mutate(file.id)} aria-label={`${t('mine.view')} ${file.fileName}`}>
                {t('mine.view')}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {application.coverLetterText && (
        <div className="space-y-1 border-t border-border pt-4">
          <h3 className="text-label-md text-foreground">{t('mine.coverLetterText')}</h3>
          <p dir="auto" className="whitespace-pre-line text-start text-body-md text-muted-foreground">{application.coverLetterText}</p>
        </div>
      )}
    </section>
  );
}
