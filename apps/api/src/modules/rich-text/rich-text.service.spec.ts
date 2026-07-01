import { Logger } from '@nestjs/common';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';

// document-engine-core is ESM-only and is the engine's own tested unit; mock it so
// this suite exercises OUR orchestration, not Tiptap's serializer. `generateHTML`
// returns controlled HTML so the pipeline is deterministic.
jest.mock('@phuong-tran-redoc/document-engine-core', () => ({
  __esModule: true,
  LATEST_SCHEMA_VERSION: 1,
  defaultExtensions: [],
  // Identity migration that re-stamps the latest version, mirroring real v0.1.x
  // behaviour — lets us assert the service calls migrate and forwards `.content`.
  migrateDoc: jest.fn((doc: EditorDocument) => ({ schemaVersion: 1, content: doc.content })),
  generateHTML: jest.fn(),
}));

// rte-core's `sanitizeRichText` transitively loads jsdom — an ESM-in-node_modules
// tree the api jest transformer won't process. Its behaviour (strip <script>, drop
// javascript:, harden <a>, whitelist) is owned and fully tested in rte-core's own
// spec (rte.sanitize.spec.ts). Here we mock it and verify the service ROUTES the
// generated HTML through it and reacts to its output — the same "mock the heavy
// ESM/DOM dep in unit tests" approach the rte-tiptap editor spec uses.
jest.mock('@portfolio/shared/features/rte-core', () => ({
  __esModule: true,
  sanitizeRichText: jest.fn((html: string) => html),
}));

import { generateHTML, migrateDoc } from '@phuong-tran-redoc/document-engine-core';
import { sanitizeRichText } from '@portfolio/shared/features/rte-core';
import { RichTextService } from './rich-text.service';

describe('RichTextService', () => {
  let service: RichTextService;
  const gen = generateHTML as jest.Mock;
  const migrate = migrateDoc as jest.Mock;
  const sanitize = sanitizeRichText as jest.Mock;

  const doc = (text: string): EditorDocument => ({
    schemaVersion: 1,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
  });

  beforeEach(() => {
    service = new RichTextService();
    gen.mockReset();
    migrate.mockClear();
    sanitize.mockReset();
    sanitize.mockImplementation((html: string) => html); // identity unless overridden
  });

  describe('toCanonicalForm', () => {
    it('pipes migrate → generateHTML(content, extensions) → sanitize into the triple', async () => {
      gen.mockResolvedValue('<p>raw</p>');
      sanitize.mockReturnValue('<p>cln</p>'); // same length → no strip warning
      const input = doc('hello');

      const result = await service.toCanonicalForm(input);

      expect(migrate).toHaveBeenCalledWith(input);
      expect(gen).toHaveBeenCalledWith(input.content, []); // migrated content + defaultExtensions
      expect(sanitize).toHaveBeenCalledWith('<p>raw</p>');
      expect(result).toEqual({
        json: { schemaVersion: 1, content: input.content },
        // D3 adapter output: E's Tiptap doc normalized to our PortableDocument.
        canonical: { schemaVersion: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }] },
        html: '<p>cln</p>',
        schemaVersion: 1,
      });
    });

    it('warns (with the field name) when the sanitizer changes the HTML', async () => {
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      gen.mockResolvedValue('<p>ok</p><script>x</script>');
      sanitize.mockReturnValue('<p>ok</p>'); // shorter → something was stripped

      await service.toCanonicalForm(doc('x'), 'profile.bioLong');

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('profile.bioLong');
      warn.mockRestore();
    });

    it('does not warn when the sanitizer returns the HTML unchanged', async () => {
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      gen.mockResolvedValue('<p>clean</p>');
      sanitize.mockReturnValue('<p>clean</p>');

      await service.toCanonicalForm(doc('x'));

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('reshapes a pipeline failure into a serialized 400 carrying the field name (not a raw 500)', async () => {
      // e.g. a schemaVersion with no registered migration — migrateDoc throws a raw Error
      migrate.mockImplementationOnce(() => {
        throw new Error('[migrateDoc] No migration registered for schemaVersion 99');
      });

      await expect(service.toCanonicalForm(doc('x'), 'profile.bioLong')).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'COMMON_VALIDATION_ERROR',
        message: expect.stringContaining('profile.bioLong'),
      });
      // failed before sanitization → no half-processed HTML reaches the gate
      expect(sanitize).not.toHaveBeenCalled();
    });
  });

  describe('toCanonicalFormTranslatable', () => {
    it('assembles both locales and shares one schema version', async () => {
      // Promise.all initiates en before vi, so the once-queue maps in that order.
      gen.mockResolvedValueOnce('<p>en</p>').mockResolvedValueOnce('<p>vi</p>');
      const en = doc('hi');
      const vi = doc('chao');

      const result = await service.toCanonicalFormTranslatable({ en, vi });

      expect(result.json).toEqual({
        en: { schemaVersion: 1, content: en.content },
        vi: { schemaVersion: 1, content: vi.content },
      });
      expect(result.html).toEqual({ en: '<p>en</p>', vi: '<p>vi</p>' });
      expect(result.schemaVersion).toBe(1);
      // Both locales carry the normalized canonical PortableDocument.
      expect(result.canonical).toEqual({
        en: { schemaVersion: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] },
        vi: { schemaVersion: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'chao' }] }] },
      });
    });

    it('routes each locale through the sanitizer independently', async () => {
      gen.mockResolvedValueOnce('<p>en-raw</p>').mockResolvedValueOnce('<p>vi-raw</p>');
      sanitize.mockImplementation((html: string) => html.replace('-raw', ''));

      const { html } = await service.toCanonicalFormTranslatable({ en: doc('a'), vi: doc('b') });

      expect(html).toEqual({ en: '<p>en</p>', vi: '<p>vi</p>' });
      expect(sanitize).toHaveBeenCalledTimes(2);
    });
  });
});
