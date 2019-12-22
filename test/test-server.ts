import http from 'http';
import getPort from 'get-port';

const defaultRequestListener: http.RequestListener = (_, res) => {
  res.writeHead(200);
  res.end();
};

export default async function createTestServer(
  requestListener: http.RequestListener = defaultRequestListener,
) {
  const instance = http.createServer(requestListener);

  const hostname = 'localhost' as string;
  const port = await getPort();
  const host = `localhost:${port}`;
  const url = `http://${host}`;

  const start = () => {
    return new Promise((resolve, reject) => {
      try {
        instance.listen(port, hostname, () => {
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const close = () =>
    new Promise((resolve, reject) => {
      instance.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

  const runTask = async <T>(task: () => Promise<T> | T): Promise<T> => {
    await start();

    const response = await task();

    await close();

    return response;
  };

  return {
    instance,
    port,
    hostname,
    host,
    start,
    close,
    runTask,
    url,
  };
}
