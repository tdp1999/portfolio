export type TemplateData = Record<string, string>;

export interface EmailTemplate {
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

export interface IEmailTemplateRepository {
  getTemplate(key: string, locale: string, data: TemplateData): EmailTemplate;
  hasTemplate(key: string, locale: string): boolean;
}
