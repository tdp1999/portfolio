import { Module } from '@nestjs/common';
import { RichTextService } from './rich-text.service';

/**
 * Provides the write-time {@link RichTextService}. Stateless and dependency-free,
 * so any module that persists a rich field imports this and injects the service
 * into its command handlers.
 */
@Module({
  providers: [RichTextService],
  exports: [RichTextService],
})
export class RichTextModule {}
