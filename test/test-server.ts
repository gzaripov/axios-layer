import http from 'http';
import getPort from 'get-port';

export default async function createTestServer() {
  const instance = http.createServer((_, res) => {
    res.writeHead(200);
    res.end();
  });

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

  const close = () => instance.close();

  afterEach(close);

  return {
    instance,
    port,
    hostname,
    host,
    start,
    close,
    url,
  };
}
