import { createAxiosMock } from '../test/axios-mock';
import createTestServer from '../test/test-server';
import { wrapAxios } from './wrap';

describe('Axios Wrap', () => {
  it('should call provided layers', async () => {
    const axios = createAxiosMock();

    axios.mock.onGet('/test').reply(200);

    const order: number[] = [];

    const layerOne = jest.fn((makeRequest) => {
      order.push(1);

      // dont call makeRequest
      return makeRequest;
    });

    const layerTwo = jest.fn((makeRequest) => {
      order.push(2);

      return makeRequest();
    });

    wrapAxios(axios, layerOne);
    wrapAxios(axios, layerTwo);

    // dont put await here, layers are called synchronously
    axios.get('/test');

    expect(order).toEqual([2, 1]);
    expect(layerOne).toHaveBeenCalledTimes(1);
    expect(layerTwo).toHaveBeenCalledTimes(1);
  });

  it('should return result of last added layer in case it doesnt call makeRequest', async () => {
    const axios = createAxiosMock();

    axios.mock.onGet('/test').reply(200);

    const layerOne = jest.fn(() => {
      return Promise.resolve(1);
    });

    const layerTwo = jest.fn(() => {
      return Promise.resolve(2);
    });

    wrapAxios(axios, layerOne);
    wrapAxios(axios, layerTwo);

    // dont put await here, layers are called synchronously
    const result = await axios.get('/test');

    expect(result).toBe(2);
  });

  it('should call provided layer only once for one request when go to real server', async () => {
    const server = await createTestServer();
    const axios = createAxiosMock();

    const order: number[] = [];

    const layerOne = jest.fn((makeRequest) => {
      order.push(1);

      return makeRequest();
    });

    const layerTwo = jest.fn((makeRequest) => {
      order.push(2);

      return makeRequest();
    });

    axios.mock.onGet('/test').reply(200);

    wrapAxios(axios, layerOne);
    wrapAxios(axios, layerTwo);

    await server.start();
    await axios.get('/test');

    expect(order).toEqual([2, 1]);
    expect(layerOne).toHaveBeenCalledTimes(1);
    expect(layerTwo).toHaveBeenCalledTimes(1);
  });
});
