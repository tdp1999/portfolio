import type { DocumentEngineConfig } from '@phuong-tran-redoc/document-engine-angular';
import type { EditorMode } from '@portfolio/shared/features/rte-core';

// Semantic-only engine config. The editor must carry *content* meaning, never
// presentation: TextStyle/Color/FontSize/Alignment and other look-and-feel
// extensions are explicitly OFF (epic E0 line 78) because those concerns are
// owned by the landing UI that later renders the stored document.
//
// NOTE: the delivered `document-engine-angular@0.1.0` builds its extension set
// internally from this flag object — there is no raw Tiptap extension array to
// hand it. So this is the "extensions for a mode" factory the task asked for,
// expressed in the package's actual config shape.
const SEMANTIC: Partial<DocumentEngineConfig> = {
  // Block structure: headings h2–h4, lists, blockquote, code block.
  heading: { levels: [2, 3, 4] },
  list: true,
  blockquote: true,
  codeBlock: true,

  // Inline marks: bold / italic / underline / strike / inline code / link.
  bold: true,
  italic: true,
  underline: true,
  strike: true,
  code: true,
  link: true,

  // Editing UX (history) stays on; it never reaches serialized output.
  undoRedo: true,

  // Presentation concerns — OFF in every mode (owned by landing render).
  textStyleKit: false, // TextStyle + Color + FontSize all live in this kit
  fontSize: false,
  lineHeight: false,
  textAlign: false,
  textCase: false,
  indent: false,
  subscript: false,
  superscript: false,

  // Business / heavy features not used by portfolio prose — OFF.
  tables: false,
  specialCharacters: false,
  pageBreak: false,
  dynamicField: false,
  restrictedEditing: false,
  markdown: false,

  // Media — OFF in semantic mode.
  image: false,
  imageRef: false,
};

// Full mode = semantic + the URL-free `image-ref` node. The actual image insert
// hook (image.onPick → MEDIA_PICKER_HOOK) is layered on at runtime by the
// component, since it depends on whether a consumer provided a picker.
const FULL: Partial<DocumentEngineConfig> = {
  ...SEMANTIC,
  imageRef: true,
};

/**
 * Build the {@link DocumentEngineConfig} for an {@link EditorMode}.
 *
 * `'semantic'` enables the restricted block/mark set; `'full'` additionally
 * enables the `image-ref` node. Both modes disable all presentation extensions
 * (TextStyle/Color/FontSize/Alignment).
 *
 * Returns a fresh object each call so callers may safely layer runtime overrides
 * (editable, placeholder, image.onPick) without mutating the shared template.
 */
export function documentEngineConfigFor(mode: EditorMode): Partial<DocumentEngineConfig> {
  return mode === 'full' ? { ...FULL } : { ...SEMANTIC };
}
