import type { MessageChannelStatus, MessageTemplate, TemplateDraft, TemplatePreview } from '../model/templates';

/**
 * Message templates (port; backend P1 PR 5, `GET/PUT /api/v2/message-templates` and `preview`,
 * `notifications.templates`). One template per event, channel and language (FR-NTF-02); the backend
 * renders each message in the recipient's language (R10).
 *
 * Errors: `MessageTemplate.NotFound`, `MessageTemplate.ProviderManaged` (a WhatsApp template's text
 * changes through Meta), `MessageTemplate.BodyRequired`, `MessageTemplate.SubjectRequired`,
 * `MessageTemplate.UnknownPlaceholder`, `MessageTemplate.MissingPlaceholder`, `MessageTemplate.TooLong`
 * (an SMS over `MAX_SMS_SEGMENTS`), `Concurrency.Conflict`, `Access.OutOfScope`.
 */
export interface MessageTemplatesService {
  /** Every template (a full list, not paged). Templates of modules that are off are included; the UI hides them. */
  list(): Promise<MessageTemplate[]>;
  /** Renders a draft with sample values and reports its problems, without saving. */
  preview(templateId: string, draft: TemplateDraft): Promise<TemplatePreview>;
  /** Saves the subject and body; `rowVersion` must be the one last read. The change is audited. */
  update(templateId: string, draft: TemplateDraft, rowVersion: string): Promise<MessageTemplate>;
}

/**
 * The messaging channels and how they are doing (port; `integrations.manage`). Read-only: channels are
 * switched on in the platform's settings (06 §9.2), not per clinic.
 */
export interface MessageChannelsService {
  list(): Promise<MessageChannelStatus[]>;
}
