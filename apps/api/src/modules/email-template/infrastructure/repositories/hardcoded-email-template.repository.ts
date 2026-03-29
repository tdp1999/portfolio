import { Injectable } from '@nestjs/common';

import { NotFoundError, ErrorLayer, EmailTemplateErrorCode } from '@portfolio/shared/errors';

import {
  EmailTemplate,
  IEmailTemplateRepository,
  TemplateData,
} from '../../application/ports/email-template.repository.port';
import { adminNotificationTemplates } from '../templates/admin-notification.template';
import { contactAutoReplyTemplates } from '../templates/contact-auto-reply.template';

type TemplateFn = (data: TemplateData) => EmailTemplate;
type TemplateRegistry = Record<string, Record<string, TemplateFn>>;

const DEFAULT_LOCALE = 'en';

const TEMPLATE_REGISTRY: TemplateRegistry = {
  'contact-auto-reply': contactAutoReplyTemplates,
  'admin-notification': adminNotificationTemplates,
};

@Injectable()
export class HardcodedEmailTemplateRepository implements IEmailTemplateRepository {
  getTemplate(key: string, locale: string, data: TemplateData): EmailTemplate {
    const localeTemplates = TEMPLATE_REGISTRY[key];

    if (!localeTemplates) {
      throw NotFoundError(`Email template "${key}" not found`, {
        layer: ErrorLayer.INFRASTRUCTURE,
        errorCode: EmailTemplateErrorCode.NOT_FOUND,
      });
    }

    const templateFn = localeTemplates[locale] ?? localeTemplates[DEFAULT_LOCALE];

    if (!templateFn) {
      throw NotFoundError(`Email template "${key}" has no locale "${locale}" or fallback`, {
        layer: ErrorLayer.INFRASTRUCTURE,
        errorCode: EmailTemplateErrorCode.NOT_FOUND,
      });
    }

    return templateFn(data);
  }

  hasTemplate(key: string, locale: string): boolean {
    const localeTemplates = TEMPLATE_REGISTRY[key];
    if (!localeTemplates) return false;
    return locale in localeTemplates || DEFAULT_LOCALE in localeTemplates;
  }
}
