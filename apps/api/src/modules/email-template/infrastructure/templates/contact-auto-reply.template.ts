import { EmailTemplate, TemplateData } from '../../application/ports/email-template.repository.port';
import { escapeHtml, sanitizeSubject } from './html-escape.util';

interface ContactAutoReplyTemplates {
  [locale: string]: (data: TemplateData) => EmailTemplate;
}

export const contactAutoReplyTemplates: ContactAutoReplyTemplates = {
  en: (data) => ({
    subject: sanitizeSubject(`Thank you for reaching out, ${data['name'] ?? ''}`),
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for your message, ${escapeHtml(data['name'] ?? '')}</h2>
        <p>I've received your message and will get back to you within 1–3 days.</p>
        <p><strong>Here's a summary of what you sent:</strong></p>
        <ul>
          <li><strong>Subject:</strong> ${escapeHtml(data['subject'] ?? '')}</li>
          <li><strong>Purpose:</strong> ${escapeHtml(data['purpose'] ?? '')}</li>
        </ul>
        <p>If you need to follow up sooner, feel free to reply to this email.</p>
        <p>Best regards,<br/>Phuong Tran</p>
      </div>
    `.trim(),
    bodyText: [
      `Thank you for your message, ${data['name'] ?? ''}`,
      '',
      "I've received your message and will get back to you within 1–3 days.",
      '',
      "Here's a summary of what you sent:",
      `- Subject: ${data['subject'] ?? ''}`,
      `- Purpose: ${data['purpose'] ?? ''}`,
      '',
      'If you need to follow up sooner, feel free to reply to this email.',
      '',
      'Best regards,',
      'Phuong Tran',
    ].join('\n'),
  }),

  vi: (data) => ({
    subject: sanitizeSubject(`Cảm ơn bạn đã liên hệ, ${data['name'] ?? ''}`),
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Cảm ơn bạn đã gửi tin nhắn, ${escapeHtml(data['name'] ?? '')}</h2>
        <p>Tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong vòng 1–3 ngày.</p>
        <p><strong>Tóm tắt nội dung bạn đã gửi:</strong></p>
        <ul>
          <li><strong>Chủ đề:</strong> ${escapeHtml(data['subject'] ?? '')}</li>
          <li><strong>Mục đích:</strong> ${escapeHtml(data['purpose'] ?? '')}</li>
        </ul>
        <p>Nếu bạn cần phản hồi sớm hơn, hãy trả lời email này.</p>
        <p>Trân trọng,<br/>Trần Đức Phương</p>
      </div>
    `.trim(),
    bodyText: [
      `Cảm ơn bạn đã gửi tin nhắn, ${data['name'] ?? ''}`,
      '',
      'Tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong vòng 1–3 ngày.',
      '',
      'Tóm tắt nội dung bạn đã gửi:',
      `- Chủ đề: ${data['subject'] ?? ''}`,
      `- Mục đích: ${data['purpose'] ?? ''}`,
      '',
      'Nếu bạn cần phản hồi sớm hơn, hãy trả lời email này.',
      '',
      'Trân trọng,',
      'Trần Đức Phương',
    ].join('\n'),
  }),
};
