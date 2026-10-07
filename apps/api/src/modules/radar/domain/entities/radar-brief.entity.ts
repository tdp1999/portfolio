import { RadarBriefWriter, RadarWorkStatus } from '@prisma/client';

import { BadRequestError, ConflictError, ErrorLayer, RadarErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue, TemporalValue } from '@portfolio/shared/types';

import { CreateRadarBriefPayload, RadarBriefProducer, RadarBriefProps } from '../radar-brief.types';

/**
 * A catch-up summary of the analyzed posts in a time window. The row is its own work item: its
 * writer (the server AI in the tick, or the worker) claims it under a lease, as posts are claimed,
 * and submits the markdown once.
 */
export class RadarBrief {
  // --- Constants ---

  /** How the body links a claim to its post: the console Detail route. */
  private static readonly ITEM_LINK = /\]\(\/radar\/items\/([0-9a-f-]{36})\)/gi;

  private constructor(private readonly props: RadarBriefProps) {}

  // --- Factory Methods ---

  /**
   * A brief waits for its writer. A window with no analyzed post would give an empty brief, so it
   * is refused here; `waiting` says whether another brief is still unwritten (one at a time).
   */
  static create(data: CreateRadarBriefPayload, windowItemCount: number, waiting: boolean): RadarBrief {
    if (waiting) {
      throw ConflictError('A brief is already waiting for its writer', {
        errorCode: RadarErrorCode.BRIEF_ALREADY_WAITING,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (windowItemCount === 0) {
      throw BadRequestError('No analyzed posts fall in this window', {
        errorCode: RadarErrorCode.BRIEF_EMPTY_WINDOW,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return new RadarBrief({
      ...data,
      id: IdentifierValue.v7(),
      body: '',
      itemIds: [],
      workStatus: RadarWorkStatus.PENDING,
      leaseExpiresAt: null,
      producer: null,
      error: null,
      createdAt: TemporalValue.now(),
    });
  }

  static load(props: RadarBriefProps): RadarBrief {
    return new RadarBrief(props);
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get sourceId(): string | null {
    return this.props.sourceId;
  }

  get windowFrom(): Date {
    return this.props.windowFrom;
  }

  get windowTo(): Date {
    return this.props.windowTo;
  }

  get body(): string {
    return this.props.body;
  }

  get itemIds(): readonly string[] {
    return this.props.itemIds;
  }

  get workStatus(): RadarWorkStatus {
    return this.props.workStatus;
  }

  get leaseExpiresAt(): Date | null {
    return this.props.leaseExpiresAt;
  }

  get producer(): RadarBriefProducer | null {
    return this.props.producer;
  }

  get writer(): RadarBriefWriter {
    return this.props.writer;
  }

  get error(): string | null {
    return this.props.error;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // --- Rules ---

  /**
   * The writer's markdown, accepted only while it holds the brief. Every post the body links to
   * must be one of the window's analyzed posts, and it must link to at least one: a claim the
   * Owner cannot trace back to a post is not accepted.
   */
  complete(body: string, windowItemIds: readonly string[], producer: RadarBriefProducer): RadarBrief {
    if (this.props.workStatus !== RadarWorkStatus.CLAIMED) {
      throw BadRequestError('This brief is not claimed by its writer', {
        errorCode: RadarErrorCode.BRIEF_NOT_CLAIMED,
        layer: ErrorLayer.DOMAIN,
      });
    }
    const linked = RadarBrief.linkedItemIds(body);
    const inWindow = new Set(windowItemIds);
    const outside = linked.filter((id) => !inWindow.has(id));
    if (linked.length === 0 || outside.length > 0) {
      throw BadRequestError(
        'The brief must link to posts of its window, and only to those',
        {
          errorCode: RadarErrorCode.BRIEF_INVALID_LINKS,
          layer: ErrorLayer.DOMAIN,
        },
        { outsideItemIds: outside }
      );
    }
    return new RadarBrief({
      ...this.props,
      body,
      itemIds: [...windowItemIds],
      workStatus: RadarWorkStatus.DONE,
      leaseExpiresAt: null,
      producer,
      error: null,
    });
  }

  /**
   * The writer gave up on a claimed brief (an AUTO brief the AI could not write): it ends DONE with
   * no body and the reason, so it stops blocking a new request and the Owner sees why.
   */
  fail(reason: string): RadarBrief {
    if (this.props.workStatus !== RadarWorkStatus.CLAIMED) {
      throw BadRequestError('This brief is not claimed by its writer', {
        errorCode: RadarErrorCode.BRIEF_NOT_CLAIMED,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return new RadarBrief({ ...this.props, workStatus: RadarWorkStatus.DONE, leaseExpiresAt: null, error: reason });
  }

  toProps(): RadarBriefProps {
    return { ...this.props, itemIds: [...this.props.itemIds] };
  }

  // --- Private ---

  private static linkedItemIds(body: string): string[] {
    return [...new Set([...body.matchAll(RadarBrief.ITEM_LINK)].map((m) => m[1].toLowerCase()))];
  }
}
