import { handleGartuaFeedRequest } from '../../src/lib/gartuaProxy';

export default async (request: Request): Promise<Response> => handleGartuaFeedRequest(request);

export const config = {
  path: '/fbapi/api/fieldboss.php',
};
