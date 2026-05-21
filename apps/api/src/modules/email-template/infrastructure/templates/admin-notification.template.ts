import { EmailTemplate, TemplateData } from '../../application/ports/email-template.repository.port';
import { ctaButton, EMAIL_TOKENS, wrapEmail } from './email-shared.util';
import { escapeHtml, sanitizeSubject, sanitizeUrl } from './html-escape.util';

interface AdminNotificationTemplates {
  [locale: string]: (data: TemplateData) => EmailTemplate;
}

const T = EMAIL_TOKENS;

/**
 * V1 "friendly triage" — graduated from `/ddl/email-templates` 2026-05-19.
 * EN-only by design: admin notifications go to me for triage; consistent EN
 * makes filtering / scanning faster than a mixed-locale inbox.
 */
function adminBodyEn(data: TemplateData): string {
  const name = escapeHtml(data['name'] ?? '');
  const email = escapeHtml(data['email'] ?? '');
  const subject = escapeHtml(data['subject'] ?? '');
  const purpose = escapeHtml(data['purpose'] ?? '');
  const locale = escapeHtml(data['locale'] ?? '');
  const message = escapeHtml(data['message'] ?? '');
  const messageId = escapeHtml(data['messageId'] ?? '');
  const consoleUrl = sanitizeUrl(data['consoleUrl'] ?? '');
  const innerRows = `
    <tr>
      <td style="padding:0 8px;">
        <div style="font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${T.accent};margin-bottom:10px;">New message · ${purpose}</div>
        <h1 style="margin:0 0 18px 0;font-size:22px;line-height:1.35;font-weight:700;letter-spacing:-0.015em;color:${T.ink};">${name} just wrote in.</h1>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px 0;font-size:14px;color:${T.inkSoft};">
          <tr>
            <td style="padding:4px 0;width:88px;color:${T.inkMute};">From</td>
            <td style="padding:4px 0;"><a href="mailto:${email}" style="color:${T.accent};text-decoration:none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:${T.inkMute};">Subject</td>
            <td style="padding:4px 0;color:${T.ink};">${subject}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:${T.inkMute};">Locale</td>
            <td style="padding:4px 0;color:${T.ink};">${locale}</td>
          </tr>
        </table>
        <blockquote style="margin:0 0 28px 0;padding:14px 18px;background:${T.blockBg};border-left:3px solid ${T.accent};border-radius:0 8px 8px 0;font-size:14px;line-height:1.7;color:${T.inkSoft};white-space:pre-wrap;">${message}</blockquote>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 8px 40px 8px;">
        ${ctaButton(consoleUrl, 'View in Console')}
      </td>
    </tr>`;
  const footer = `Admin notification · message id <span style="font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;">${messageId.slice(0, 8)}…</span>`;
  return wrapEmail(innerRows, { footerHtml: footer });
}

export const adminNotificationTemplates: AdminNotificationTemplates = {
  en: (data) => ({
    subject: sanitizeSubject(`New contact message: ${data['subject'] ?? '(no subject)'}`),
    bodyHtml: adminBodyEn(data),
    bodyText: [
      `New message — ${data['purpose'] ?? ''}`,
      `${data['name'] ?? ''} just wrote in.`,
      '',
      `From: ${data['name'] ?? ''} <${data['email'] ?? ''}>`,
      `Subject: ${data['subject'] ?? ''}`,
      `Locale: ${data['locale'] ?? ''}`,
      '',
      'Message:',
      '--------',
      data['message'] ?? '',
      '',
      `View in Console: ${data['consoleUrl'] ?? ''}`,
      '',
      `Message id: ${data['messageId'] ?? ''}`,
    ].join('\n'),
  }),
};
