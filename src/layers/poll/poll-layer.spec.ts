import pollLayer from './poll-layer';
import createTestServer, {
  errorRequestListener,
  okRequestListener,
} from '../../../test/test-server';
import { create } from '../..';

describe('Poll layer', () => {
  it('should throw if retries is 0', async () => {
    const listener = jest.fn(errorRequestListener);
    const testServer = await createTestServer(listener);
    const transport = create({
      layers: [
        pollLayer({
          delay: 5000,
          retries: 0,
        }),
      ],
    });

    const request = testServer.runTask(() => transport.get(`${testServer.url}/test`));

    await expect(request).rejects.toThrowError();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should retry ten times with delay 10', async () => {
    const listener = jest.fn(errorRequestListener);
    const testServer = await createTestServer(listener);
    const transport = create({
      layers: [pollLayer({ retries: 10, delay: 10 })],
    });

    const request = testServer.runTask(() => transport.get(`${testServer.url}/test`));

    await expect(request).rejects.toThrowError();

    expect(listener).toHaveBeenCalledTimes(10);
  });

  it('should retry ten times with delay 10', async () => {
    const listener = jest.fn((req, res) => {
      const calls = listener.mock.calls.length;

      if (calls === 10) {
        return okRequestListener(req, res);
      }

      return errorRequestListener(req, res);
    });
    const testServer = await createTestServer(listener);
    const transport = create({
      layers: [pollLayer({ retries: 10, delay: 10 })],
    });

    await testServer.runTask(() => transport.get(`${testServer.url}/test`));

    expect(listener).toHaveBeenCalledTimes(10);
  });
});
