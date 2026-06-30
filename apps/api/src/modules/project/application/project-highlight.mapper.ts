import { TechnicalHighlightInput } from './ports/project.repository.port';
import { ProjectHighlightDto } from '../infrastructure/mapper/project.mapper';
import { RichTextService } from '../../rich-text';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';

/** A highlight as it arrives in the create/update DTO (identical schema). */
export type HighlightDto = NonNullable<(CreateProjectDto | UpdateProjectDto)['highlights']>[number];

const EMPTY_LOCALE = { en: '', vi: '' };

/**
 * DTO highlight → repo input: run the RTE pipeline per Challenge/Approach/Outcome
 * field. Legacy markdown is kept empty during the transition (the `*Json` docs are
 * the source of truth). Shared by the create + update handlers.
 */
export async function mapHighlightDtoToInput(
  richText: RichTextService,
  h: HighlightDto,
  displayOrder: number
): Promise<TechnicalHighlightInput> {
  const [challengeRich, approachRich, outcomeRich] = await Promise.all([
    h.challengeJson ? richText.toCanonicalFormTranslatable(h.challengeJson, 'project.highlight.challenge') : null,
    h.approachJson ? richText.toCanonicalFormTranslatable(h.approachJson, 'project.highlight.approach') : null,
    h.outcomeJson ? richText.toCanonicalFormTranslatable(h.outcomeJson, 'project.highlight.outcome') : null,
  ]);
  return {
    challenge: h.challenge ?? EMPTY_LOCALE,
    approach: h.approach ?? EMPTY_LOCALE,
    outcome: h.outcome ?? EMPTY_LOCALE,
    challengeRich,
    approachRich,
    outcomeRich,
    codeUrl: h.codeUrl ?? null,
    displayOrder,
  };
}

/** Stored highlight → repo input: rebuild the triples from already-canonical docs. */
export function mapStoredHighlightToInput(h: ProjectHighlightDto, displayOrder: number): TechnicalHighlightInput {
  return {
    challenge: h.challenge,
    approach: h.approach,
    outcome: h.outcome,
    challengeRich: h.challengeJson
      ? { json: h.challengeJson, html: h.challengeHtml ?? EMPTY_LOCALE, schemaVersion: h.challengeSchemaVersion }
      : null,
    approachRich: h.approachJson
      ? { json: h.approachJson, html: h.approachHtml ?? EMPTY_LOCALE, schemaVersion: h.approachSchemaVersion }
      : null,
    outcomeRich: h.outcomeJson
      ? { json: h.outcomeJson, html: h.outcomeHtml ?? EMPTY_LOCALE, schemaVersion: h.outcomeSchemaVersion }
      : null,
    codeUrl: h.codeUrl,
    displayOrder,
  };
}
