import { documentEngineConfigFor } from './rte-tiptap.config';

describe('documentEngineConfigFor', () => {
  describe("'semantic' mode", () => {
    const cfg = documentEngineConfigFor('semantic');

    it('enables the restricted block set (headings h2–h4, lists, quote, code block)', () => {
      expect(cfg.heading).toEqual({ levels: [2, 3, 4] });
      expect(cfg.list).toBe(true);
      expect(cfg.blockquote).toBe(true);
      expect(cfg.codeBlock).toBe(true);
    });

    it('enables the semantic inline marks (bold/italic/u/s/code/link)', () => {
      expect(cfg.bold).toBe(true);
      expect(cfg.italic).toBe(true);
      expect(cfg.underline).toBe(true);
      expect(cfg.strike).toBe(true);
      expect(cfg.code).toBe(true);
      expect(cfg.link).toBe(true);
    });

    it('disables every presentation extension (TextStyle/Color/FontSize/Alignment)', () => {
      expect(cfg.textStyleKit).toBe(false); // TextStyle + Color + FontSize live here
      expect(cfg.fontSize).toBe(false);
      expect(cfg.lineHeight).toBe(false);
      expect(cfg.textAlign).toBe(false);
      expect(cfg.textCase).toBe(false);
      expect(cfg.indent).toBe(false);
    });

    it('disables media (no image, no image-ref)', () => {
      expect(cfg.image).toBe(false);
      expect(cfg.imageRef).toBe(false);
    });
  });

  describe("'full' mode", () => {
    const cfg = documentEngineConfigFor('full');

    it('enables the image-ref node on top of the semantic set', () => {
      expect(cfg.imageRef).toBe(true);
      expect(cfg.heading).toEqual({ levels: [2, 3, 4] });
      expect(cfg.bold).toBe(true);
    });

    it('still disables all presentation extensions', () => {
      expect(cfg.textStyleKit).toBe(false);
      expect(cfg.fontSize).toBe(false);
      expect(cfg.textAlign).toBe(false);
      expect(cfg.textCase).toBe(false);
    });

    it('leaves image.onPick unset (layered in at runtime by the component)', () => {
      expect(cfg.image).toBe(false);
    });
  });

  describe("'list' mode", () => {
    const cfg = documentEngineConfigFor('list');

    it('enables lists + inline marks usable inside a list item', () => {
      expect(cfg.list).toBe(true);
      expect(cfg.bold).toBe(true);
      expect(cfg.italic).toBe(true);
      expect(cfg.underline).toBe(true);
      expect(cfg.link).toBe(true);
    });

    it('disables block structure that does not belong in a list', () => {
      expect(cfg.heading).toBe(false);
      expect(cfg.blockquote).toBe(false);
      expect(cfg.codeBlock).toBe(false);
      expect(cfg.code).toBe(false);
    });

    it('disables media and every presentation extension', () => {
      expect(cfg.image).toBe(false);
      expect(cfg.imageRef).toBe(false);
      expect(cfg.textStyleKit).toBe(false);
      expect(cfg.textAlign).toBe(false);
    });
  });

  it('returns a fresh object each call so callers can layer overrides safely', () => {
    expect(documentEngineConfigFor('semantic')).not.toBe(documentEngineConfigFor('semantic'));
  });
});
