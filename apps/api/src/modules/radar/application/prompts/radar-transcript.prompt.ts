import { z } from 'zod/v4';

import type { AiPart } from '../../../ai';

/** The answer, before the server's checks: lengths are capped by `RadarTranscriptPrompt.toTranscript`. */
export const RadarTranscriptAnswerSchema = z.object({
  spoken: z.string().nullable(),
  onScreenText: z.string().nullable(),
  visualSummary: z.string(),
  language: z.string().nullable(),
});

export type RadarTranscriptAnswer = z.infer<typeof RadarTranscriptAnswerSchema>;

/** The request that turns one video into text the analysis can read. No tools: the video is the whole input. */
export class RadarTranscriptPrompt {
  // --- Constants ---

  /** Per field, so one long talk cannot crowd the analysis request. */
  static readonly MAX_SPOKEN = 20_000;
  static readonly MAX_ON_SCREEN = 6_000;
  static readonly MAX_SUMMARY = 2_000;

  static readonly SYSTEM = `# How to turn one video into text

You watch one video from a public post about AI news (a Facebook reel, a YouTube video). Another model analyzes the post later and cannot see the video, so you write down what it says and shows. You answer with one JSON object in the given schema, nothing else.

- "spoken": what people say, verbatim, in the language they speak. Keep technical terms and product names exactly as said. Mark a new speaker or a long pause with a new line. Null when nobody speaks (music only, silence).
- "onScreenText": text shown on screen that carries information: slide titles and bullets, captions burned into the video, code, terminal commands, numbers on a chart, URLs. One line per item, in order. Skip decorative text, watermarks and repeated subtitles of the speech. Null when there is none.
- "visualSummary": two to four sentences on what the video shows: who or what is on screen, which app or website, what is done step by step. Always set, even for a silent video.
- "language": the main language of the speech or, without speech, of the on-screen text, as a BCP 47 tag ("vi", "en"). Null when there is neither.

Write only what is in the video. Do not explain, judge or add context: that is the analysis's job. Do not use em-dashes or en-dashes.`;

  // --- Rules ---

  /** The video first, then the ask; low resolution reads slides and is several times cheaper. */
  static parts(video: { fileUri: string } | { data: string; mimeType: string }): AiPart[] {
    const media: AiPart =
      'fileUri' in video
        ? { fileUri: video.fileUri, mimeType: 'video/mp4', resolution: 'low' }
        : { inlineData: { data: video.data, mimeType: video.mimeType }, resolution: 'low' };
    return [media, { text: 'Write down what this video says and shows.' }];
  }

  /** Trims every field, caps its length and turns blank text into null. */
  static toTranscript(answer: RadarTranscriptAnswer) {
    const clip = (value: string | null, max: number) => {
      const text = value?.trim();
      return text ? text.slice(0, max) : null;
    };
    return {
      spoken: clip(answer.spoken, RadarTranscriptPrompt.MAX_SPOKEN),
      onScreenText: clip(answer.onScreenText, RadarTranscriptPrompt.MAX_ON_SCREEN),
      visualSummary: clip(answer.visualSummary, RadarTranscriptPrompt.MAX_SUMMARY) ?? '',
      language: clip(answer.language, 16),
    };
  }
}
