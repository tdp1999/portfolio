import { EmailTemplate, TemplateData } from '../../application/ports/email-template.repository.port';
import { escapeHtml, sanitizeSubject, sanitizeUrl } from './html-escape.util';

interface AdminNotificationTemplates {
  [locale: string]: (data: TemplateData) => EmailTemplate;
}

export const adminNotificationTemplates: AdminNotificationTemplates = {
  en: (data) => ({
    subject: sanitizeSubject(`New contact message: ${data['subject'] ?? '(no subject)'}`),
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Message</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; vertical-align: top;">From:</td>
            <td style="padding: 8px;">${escapeHtml(data['name'] ?? '')} &lt;${escapeHtml(data['email'] ?? '')}&gt;</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; vertical-align: top;">Purpose:</td>
            <td style="padding: 8px;">${escapeHtml(data['purpose'] ?? '')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; vertical-align: top;">Subject:</td>
            <td style="padding: 8px;">${escapeHtml(data['subject'] ?? '')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; vertical-align: top;">Locale:</td>
            <td style="padding: 8px;">${escapeHtml(data['locale'] ?? '')}</td>
          </tr>
        </table>
        <h3>Message</h3>
        <div style="padding: 16px; background: #f5f5f5; border-radius: 4px; white-space: pre-wrap;">${escapeHtml(data['message'] ?? '')}</div>
        <p style="margin-top: 16px;">
          <a href="${sanitizeUrl(data['consoleUrl'] ?? '')}">View in Console</a>
        </p>
      </div>
    `.trim(),
    bodyText: [
      'New Contact Message',
      '===================',
      '',
      `From: ${data['name'] ?? ''} <${data['email'] ?? ''}>`,
      `Purpose: ${data['purpose'] ?? ''}`,
      `Subject: ${data['subject'] ?? ''}`,
      `Locale: ${data['locale'] ?? ''}`,
      '',
      'Message:',
      '--------',
      data['message'] ?? '',
      '',
      `View in Console: ${data['consoleUrl'] ?? ''}`,
    ].join('\n'),
  }),
};
