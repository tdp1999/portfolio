export interface DownloadedMedia {
  buffer: Buffer;
  mimeType: string;
}

/** One kind of media file (images, or videos), with its own size and time limits. */
export interface IMediaDownloader {
  /** Rejects on timeout, non-2xx, a content type of another kind, or a body over the size limit. */
  download(url: string): Promise<DownloadedMedia>;
}
