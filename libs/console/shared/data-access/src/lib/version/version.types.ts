export interface VersionInfo {
  commitSha: string;
  commitShaShort: string;
  branch: string;
  environment: string;
  deploymentId: string | null;
  serverStartedAt: string;
}
