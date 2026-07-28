/** Appends a skip reason when there is one, so a mixed batch doesn't trail a bare separator. */
export const withReason = (head: string, reason: string): string => (reason ? `${head} ${reason}` : head);
