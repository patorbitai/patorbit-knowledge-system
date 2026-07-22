export const JOB_QUEUES = Symbol("JOB_QUEUES");

export function getJobQueueToken(name: string): string {
  return `JOB_QUEUE:${name}`;
}
