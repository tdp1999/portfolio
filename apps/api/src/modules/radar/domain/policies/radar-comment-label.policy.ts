import { RadarComment, RadarCommentDraft, RadarCommentLabel } from '../radar-comment.types';

/** How each comment of a post is labelled: the author, real content, filler or spam. */
export class RadarCommentLabelPolicy {
  // --- Constants ---

  /** Shortened links, chat invites and shops: what a spammer posts under a popular post. */
  private static readonly SPAM_LINK =
    /(bit\.ly|tinyurl|t\.me\/|telegram\.|zalo\.me|shopee\.|lazada\.|tiktok\.com\/@|s\.shopee)/i;
  private static readonly SPAM_PHRASE = /(^|\s)(ib|inbox|check ib|xem ib|kb zalo|add zalo|liên hệ zalo)(\s|$|[!.,])/iu;
  private static readonly LOW_PHRASE =
    /^(hóng|hong|xin link|xin|cho xin|cho mình xin|\+1|chấm|ok|oke|done|đã cmt|đã còm|cmt|còm|up|hay|hay quá|thanks|thank you|cảm ơn|cam on)$/iu;
  /** Under this many letters or digits, a comment says nothing. */
  private static readonly LOW_MIN_CHARS = 5;

  // --- Rules ---

  /** Labels every comment of one post. Copy-paste is judged across the post, so it takes the whole list. */
  static label(drafts: readonly RadarCommentDraft[]): RadarComment[] {
    const peoplePerText = RadarCommentLabelPolicy.peoplePerText(drafts);
    return drafts.map(({ profileId: _, ...comment }) => ({
      ...comment,
      label: RadarCommentLabelPolicy.labelOf(
        comment,
        (peoplePerText.get(RadarCommentLabelPolicy.duplicateKey(comment.text))?.size ?? 0) > 1
      ),
    }));
  }

  // --- Private ---

  /** Who wrote each text, by its copy-paste key; the author never counts as copying. */
  private static peoplePerText(drafts: readonly RadarCommentDraft[]): Map<string, Set<string>> {
    const people = new Map<string, Set<string>>();
    for (const draft of drafts) {
      if (draft.isAuthor) continue;
      const key = RadarCommentLabelPolicy.duplicateKey(draft.text);
      if (key.length < RadarCommentLabelPolicy.LOW_MIN_CHARS) continue;
      people.set(key, (people.get(key) ?? new Set<string>()).add(draft.profileId ?? draft.id));
    }
    return people;
  }

  private static labelOf(comment: Omit<RadarComment, 'label'>, copiedByOthers: boolean): RadarCommentLabel {
    if (comment.isAuthor) return 'author';
    if (
      copiedByOthers ||
      RadarCommentLabelPolicy.hasSpamLink(comment) ||
      RadarCommentLabelPolicy.SPAM_PHRASE.test(comment.text)
    )
      return 'spam';

    const words = comment.text.replace(/[^\p{L}\p{N}\s+]/gu, '').trim();
    if (RadarCommentLabelPolicy.LOW_PHRASE.test(words)) return 'low';
    // An image with no words is a sticker or a reaction meme, unless the image holds text.
    if (
      words.replace(/\s/g, '').length < RadarCommentLabelPolicy.LOW_MIN_CHARS &&
      !comment.images.some((i) => i.ocrText)
    )
      return 'low';
    return 'substantive';
  }

  private static hasSpamLink(comment: Omit<RadarComment, 'label'>): boolean {
    return (
      comment.links.some((l) => RadarCommentLabelPolicy.SPAM_LINK.test(l)) ||
      RadarCommentLabelPolicy.SPAM_LINK.test(comment.text)
    );
  }

  private static duplicateKey(text: string): string {
    return text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  }
}
