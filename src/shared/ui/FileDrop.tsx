import { useRef, useState, type DragEvent } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n/use-language';
import { formatFileSize } from '@/shared/lib/intl';
import { cn } from '@/shared/lib/cn';
import type { FieldControlProps } from './Field';

interface FileDropProps extends Partial<FieldControlProps> {
  file: File | null;
  onChange: (file: File | null) => void;
  /** Value of the input's `accept` attribute, e.g. ".pdf,.docx". */
  accept: string;
  /** Shown under the drop zone, e.g. "PDF or DOCX, up to 5 MB". */
  hint: string;
}

/**
 * Pick one file by dropping it or browsing. The caller validates type and size (zod) and shows the
 * error through `Field`; this only collects the file and shows what was chosen.
 */
export function FileDrop({ file, onChange, accept, hint, ...control }: FileDropProps) {
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-secondary/60 p-3">
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-primary">
          <FileText className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span dir="ltr" className="block truncate text-start text-label-md text-foreground">
            {file.name}
          </span>
          <span className="block text-body-sm text-muted-foreground">{formatFileSize(file.size, language)}</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={t('fileDrop.remove', { name: file.name })}
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-input bg-card px-4 py-8 text-center transition-colors',
        dragging && 'border-primary bg-secondary/60',
        control['aria-invalid'] && 'border-destructive'
      )}
    >
      <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
        <UploadCloud className="size-5" />
      </span>
      <p className="text-body-md text-foreground">
        {t('fileDrop.drop')}{' '}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="font-semibold text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('fileDrop.browse')}
        </button>
      </p>
      <p className="text-body-sm text-muted-foreground">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
        {...control}
      />
    </div>
  );
}
