import { EmailTemplate, TemplateData } from '../../application/ports/email-template.repository.port';
import { ctaButton, defaultFooterVi, EMAIL_TOKENS, wrapEmail } from './email-shared.util';
import { escapeHtml, sanitizeSubject } from './html-escape.util';

interface ContactAutoReplyTemplates {
  [locale: string]: (data: TemplateData) => EmailTemplate;
}

const T = EMAIL_TOKENS;

/** V1 "friendly transactional" — graduated from `/ddl/email-templates` 2026-05-19. */
function autoReplyBodyEn(data: TemplateData): string {
  const name = escapeHtml(data['name'] ?? '');
  const subject = escapeHtml(data['subject'] ?? '');
  const purpose = escapeHtml(data['purpose'] ?? '');
  const innerRows = `
    <tr>
      <td style="padding:0 8px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.35;font-weight:700;letter-spacing:-0.015em;color:${T.ink};">Thanks for reaching out, ${name}!</h1>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${T.inkSoft};">Your message landed in my inbox. I'll come back to you within a few days — usually faster. Here's what you sent for your own thread:</p>
        <ul style="margin:0 0 20px 0;padding-left:22px;font-size:15px;line-height:1.8;color:${T.inkSoft};">
          <li><strong style="color:${T.ink};">Purpose:</strong> ${purpose}</li>
          <li><strong style="color:${T.ink};">Subject:</strong> ${subject}</li>
        </ul>
        <p style="margin:0 0 28px 0;font-size:15px;line-height:1.7;color:${T.inkSoft};">If something's time-sensitive, hit reply and add a one-liner — this address goes straight to me.</p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:8px 8px 40px 8px;">
        ${ctaButton('https://thunderphong.com', 'Visit thunderphong.com')}
      </td>
    </tr>
    <tr>
      <td style="padding:0 8px 8px 8px;font-size:15px;line-height:1.7;color:${T.inkSoft};">
        <p style="margin:0;">Regards,</p>
        <p style="margin:0;color:${T.ink};font-weight:500;">Phuong Tran</p>
      </td>
    </tr>`;
  return wrapEmail(innerRows);
}

function autoReplyBodyVi(data: TemplateData): string {
  const name = escapeHtml(data['name'] ?? '');
  const subject = escapeHtml(data['subject'] ?? '');
  const purpose = escapeHtml(data['purpose'] ?? '');
  const innerRows = `
    <tr>
      <td style="padding:0 8px;">
        <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.35;font-weight:700;letter-spacing:-0.015em;color:${T.ink};">Cảm ơn bạn đã liên hệ, ${name}!</h1>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:${T.inkSoft};">Tin nhắn của bạn đã đến hộp thư của mình. Mình sẽ phản hồi trong vài ngày — thường sớm hơn. Dưới đây là nội dung bạn đã gửi, để tiện theo dõi:</p>
        <ul style="margin:0 0 20px 0;padding-left:22px;font-size:15px;line-height:1.8;color:${T.inkSoft};">
          <li><strong style="color:${T.ink};">Mục đích:</strong> ${purpose}</li>
          <li><strong style="color:${T.ink};">Chủ đề:</strong> ${subject}</li>
        </ul>
        <p style="margin:0 0 28px 0;font-size:15px;line-height:1.7;color:${T.inkSoft};">Nếu có việc gấp, bạn cứ reply email này — nó vào thẳng inbox của mình.</p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:8px 8px 40px 8px;">
        ${ctaButton('https://thunderphong.com', 'Đến thunderphong.com')}
      </td>
    </tr>
    <tr>
      <td style="padding:0 8px 8px 8px;font-size:15px;line-height:1.7;color:${T.inkSoft};">
        <p style="margin:0;">Trân trọng,</p>
        <p style="margin:0;color:${T.ink};font-weight:500;">Trần Đức Phương</p>
      </td>
    </tr>`;
  return wrapEmail(innerRows, { footerHtml: defaultFooterVi() });
}

export const contactAutoReplyTemplates: ContactAutoReplyTemplates = {
  en: (data) => ({
    subject: sanitizeSubject(`Thank you for reaching out, ${data['name'] ?? ''}`),
    bodyHtml: autoReplyBodyEn(data),
    bodyText: [
      `Thanks for reaching out, ${data['name'] ?? ''}!`,
      '',
      "Your message landed in my inbox. I'll come back to you within a few days — usually faster.",
      '',
      "Here's what you sent for your own thread:",
      `- Purpose: ${data['purpose'] ?? ''}`,
      `- Subject: ${data['subject'] ?? ''}`,
      '',
      "If something's time-sensitive, hit reply and add a one-liner — this address goes straight to me.",
      '',
      'Regards,',
      'Phuong Tran',
      '',
      '--',
      "You're receiving this because you submitted a message via thunderphong.com/contact.",
      'Your data is kept for 18 months per the privacy policy (thunderphong.com/privacy).',
    ].join('\n'),
  }),

  vi: (data) => ({
    subject: sanitizeSubject(`Cảm ơn bạn đã liên hệ, ${data['name'] ?? ''}`),
    bodyHtml: autoReplyBodyVi(data),
    bodyText: [
      `Cảm ơn bạn đã liên hệ, ${data['name'] ?? ''}!`,
      '',
      'Tin nhắn của bạn đã đến hộp thư của mình. Mình sẽ phản hồi trong vài ngày — thường sớm hơn.',
      '',
      'Nội dung bạn đã gửi, để tiện theo dõi:',
      `- Mục đích: ${data['purpose'] ?? ''}`,
      `- Chủ đề: ${data['subject'] ?? ''}`,
      '',
      'Nếu có việc gấp, bạn cứ reply email này — nó vào thẳng inbox của mình.',
      '',
      'Trân trọng,',
      'Trần Đức Phương',
      '',
      '--',
      'Bạn nhận email này vì đã gửi tin nhắn qua thunderphong.com/contact.',
      'Dữ liệu được lưu trong 18 tháng theo chính sách bảo mật (thunderphong.com/privacy).',
    ].join('\n'),
  }),
};
