import { SetMetadata } from "@nestjs/common";

export const QUEUE_METADATA = Symbol("QUEUE_METADATA");
export const PROCESS_METADATA = Symbol("PROCESS_METADATA");

export interface ProcessMetadata {
  name?: string;
}

/** Associates a processor class with a registered queue. */
export const Queue = (name = "default"): ClassDecorator =>
  SetMetadata(QUEUE_METADATA, name);

/** Marks a method as a handler for all jobs, or for one named job. */
export const Process = (name?: string): MethodDecorator =>
  SetMetadata(PROCESS_METADATA, { name } satisfies ProcessMetadata);
