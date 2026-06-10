import type { RenderedMarkdown } from '@portfolio/landing/shared/data-access';
import type { DetailState } from './blog.detail.types';

export const EMPTY_RENDER: RenderedMarkdown = { html: '', toc: [] };

export const INITIAL_STATE: DetailState = { status: 'idle', post: null, rendered: EMPTY_RENDER };

export const TOC_MIN_SECTIONS = 3;
