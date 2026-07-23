import { TechnicalHighlightInput } from './ports/project.repository.port';
import { ProjectHighlightDto } from '../infrastructure/mapper/project.mapper';
import { RichTextService } from '../../rich-text';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';

/** A highlight as it arrives in the create/update DTO (identical schema). */
export type HighlightDto = NonNullable<(CreateProjectDto | UpdateProjectDto)['highlights']>[number];

const EMPTY_LOCALE = { en: '', vi: '' };

/**
 * DTO highlight → repo input: run the RTE pipeline per Challenge/Approach/Outcome
 * field. The `*Json` docs are the source of truth. Shared by the create + update handlers.
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
    title: h.title ?? null,
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
    title: h.title,
    challengeRich: h.challengeJson
      ? {
          json: h.challengeJson,
          canonical: h.challengeCanonical ?? EMPTY_LOCALE,
          html: h.challengeHtml ?? EMPTY_LOCALE,
          schemaVersion: h.challengeSchemaVersion,
        }
      : null,
    approachRich: h.approachJson
      ? {
          json: h.approachJson,
          canonical: h.approachCanonical ?? EMPTY_LOCALE,
          html: h.approachHtml ?? EMPTY_LOCALE,
          schemaVersion: h.approachSchemaVersion,
        }
      : null,
    outcomeRich: h.outcomeJson
      ? {
          json: h.outcomeJson,
          canonical: h.outcomeCanonical ?? EMPTY_LOCALE,
          html: h.outcomeHtml ?? EMPTY_LOCALE,
          schemaVersion: h.outcomeSchemaVersion,
        }
      : null,
    codeUrl: h.codeUrl,
    displayOrder,
  };
}
