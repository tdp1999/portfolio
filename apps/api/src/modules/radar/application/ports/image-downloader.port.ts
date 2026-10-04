export interface DownloadedImage {
  buffer: Buffer;
  mimeType: string;
}

export interface IImageDownloader {
  /** Rejects on timeout, non-2xx, a non-image content type, or an oversized body. */
  download(url: string): Promise<DownloadedImage>;
}
