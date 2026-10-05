export const RADAR_SOURCE_REPOSITORY = Symbol('RADAR_SOURCE_REPOSITORY');
export const RADAR_CAPTURE_REPOSITORY = Symbol('RADAR_CAPTURE_REPOSITORY');
export const CAPTURE_NORMALIZERS = Symbol('CAPTURE_NORMALIZERS');
export const RADAR_IMAGE_REPOSITORY = Symbol('RADAR_IMAGE_REPOSITORY');
export const IMAGE_DOWNLOADER = Symbol('IMAGE_DOWNLOADER');
export const RADAR_WORK_REPOSITORY = Symbol('RADAR_WORK_REPOSITORY');
export const RADAR_PROFILE_REPOSITORY = Symbol('RADAR_PROFILE_REPOSITORY');
export const RADAR_ITEM_REPOSITORY = Symbol('RADAR_ITEM_REPOSITORY');
export const RADAR_RUN_REPOSITORY = Symbol('RADAR_RUN_REPOSITORY');
/** Hybrid capture providers, resolved per run by the run's `captureAdapter` name. */
export const CAPTURE_PROVIDERS = Symbol('CAPTURE_PROVIDERS');
/** Analysis providers, resolved per run by the run's `llmAdapter` name. */
export const LLM_PROVIDERS = Symbol('LLM_PROVIDERS');
