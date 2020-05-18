import { AxiosLayer } from '../../wrap';

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

type Options = { delay: number; retries: number };

const pollLayer = ({ delay, retries }: Options): AxiosLayer => async (request) => {
  const poll = (retry: number): Promise<any> => {
    return request().catch((error) => {
      const retriesLeft = retry - 1;

      if (retriesLeft <= 0) {
        throw error;
      }

      return sleep(delay).then(() => poll(retriesLeft));
    });
  };

  return poll(retries);
};

export default pollLayer;
