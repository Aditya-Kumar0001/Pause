import type { IncomingMessage, ServerResponse } from 'node:http';

export function createKinkooApi(options?: {
  projectId?: string;
  databasePath?: string;
}): (request: IncomingMessage, response: ServerResponse) => Promise<boolean>;
