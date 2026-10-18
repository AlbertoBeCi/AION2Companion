import { handleGartuaFeedRequest } from '../../../src/lib/gartuaProxy';

interface PagesGetContext {
  request: Request;
}

export function onRequestGet({ request }: PagesGetContext): Promise<Response> {
  return handleGartuaFeedRequest(request);
}
