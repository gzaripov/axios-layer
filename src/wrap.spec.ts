import Axios, { AxiosRequestConfig } from 'axios';
import { createAxiosMock } from '../test/axios-mock';
import createTestServer from '../test/test-server';
import { wrapAxios, extendAxios } from './wrap';

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
    const testServer = await createTestServer();
    const axiosInstance = Axios.create();

    const order: number[] = [];

    const layerOne = jest.fn((makeRequest) => {
      order.push(1);

      return makeRequest();
    });

    const layerTwo = jest.fn((makeRequest) => {
      order.push(2);

      return makeRequest();
    });

    wrapAxios(axiosInstance, layerOne);
    wrapAxios(axiosInstance, layerTwo);

    await testServer.runTask(async () => {
      await axiosInstance.get(`${testServer.url}/test`);
    });

    expect(order).toEqual([2, 1]);
    expect(layerOne).toHaveBeenCalledTimes(1);
    expect(layerTwo).toHaveBeenCalledTimes(1);
  });

  it('should work with string data in post request', async () => {
    const axios = createAxiosMock();

    axios.mock.onPost('/test').reply((config: AxiosRequestConfig) => {
      return [200, `${config.data}-three`];
    });

    const layer = jest.fn((makeRequest, config: AxiosRequestConfig) => {
      return makeRequest({
        ...config,
        data: `${config.data}-two`,
      });
    });

    wrapAxios(axios, layer);

    const result = await axios.post('/test', 'one');

    expect(layer).toHaveBeenCalledTimes(1);
    expect(result.data).toBe('one-two-three');
  });

  it('should work with object data in post request', async () => {
    const axios = createAxiosMock();

    axios.mock.onPost('/test').reply((config: AxiosRequestConfig) => {
      return [200, `${JSON.parse(config.data).number}-three`];
    });

    const layer = jest.fn((makeRequest, config: AxiosRequestConfig) => {
      return makeRequest({
        ...config,
        data: { number: `${config.data.number}-two` },
      });
    });

    wrapAxios(axios, layer);

    const result = await axios.post('/test', { number: 'one' });

    expect(layer).toHaveBeenCalledTimes(1);
    expect(result.data).toBe('one-two-three');
  });

  it('should work with axios.request method', async () => {
    const axios = createAxiosMock();

    axios.mock.onGet('/test').reply((config: AxiosRequestConfig) => {
      return [200, config.data * 2];
    });

    const layer = jest.fn((makeRequest, config: AxiosRequestConfig) => {
      return makeRequest({
        ...config,
        data: config.data * 3 + 1,
      });
    });

    wrapAxios(axios, layer);

    const result = await axios.request({
      url: '/test',
      method: 'get',
      data: 1,
    });

    expect(layer).toHaveBeenCalledTimes(1);
    expect(result.data).toBe(8);
  });
});

describe('Axios Extend', () => {
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

    const wrappedAxios = extendAxios(axios, layerOne, layerTwo);

    // dont put await here, layers are called synchronously
    wrappedAxios.get('/test');

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

    const wrappedAxios = extendAxios(axios, layerOne, layerTwo);

    // dont put await here, layers are called synchronously
    const result = await wrappedAxios.get('/test');

    expect(result).toBe(2);
  });

  it('should call provided layer only once for one request when go to real server', async () => {
    const testServer = await createTestServer();
    const axiosInstance = Axios.create();

    const order: number[] = [];

    const layerOne = jest.fn((makeRequest) => {
      order.push(1);

      return makeRequest();
    });

    const layerTwo = jest.fn((makeRequest) => {
      order.push(2);

      return makeRequest();
    });

    const wrappedAxios = extendAxios(axiosInstance, layerOne, layerTwo);

    await testServer.runTask(async () => {
      await wrappedAxios.get(`${testServer.url}/test`);
    });

    expect(order).toEqual([2, 1]);
    expect(layerOne).toHaveBeenCalledTimes(1);
    expect(layerTwo).toHaveBeenCalledTimes(1);
  });

  it('should work with string data in post request', async () => {
    const axios = createAxiosMock();

    axios.mock.onPost('/test').reply((config: AxiosRequestConfig) => {
      return [200, `${config.data}-three`];
    });

    const layer = jest.fn((makeRequest, config: AxiosRequestConfig) => {
      return makeRequest({
        ...config,
        data: `${config.data}-two`,
      });
    });

    const wrappedAxios = extendAxios(axios, layer);

    const result = await wrappedAxios.post('/test', 'one');

    expect(layer).toHaveBeenCalledTimes(1);
    expect(result.data).toBe('one-two-three');
  });

  it('should work with object data in post request', async () => {
    const axios = createAxiosMock();

    axios.mock.onPost('/test').reply((config: AxiosRequestConfig) => {
      return [200, `${JSON.parse(config.data).number}-three`];
    });

    const layer = jest.fn((makeRequest, config: AxiosRequestConfig) => {
      return makeRequest({
        ...config,
        data: { number: `${config.data.number}-two` },
      });
    });

    const wrappedAxios = extendAxios(axios, layer);

    const result = await wrappedAxios.post('/test', { number: 'one' });

    expect(layer).toHaveBeenCalledTimes(1);
    expect(result.data).toBe('one-two-three');
  });

  it('should work with axios.request method', async () => {
    const axios = createAxiosMock();

    axios.mock.onGet('/test').reply((config: AxiosRequestConfig) => {
      return [200, config.data * 2];
    });

    const layer = jest.fn((makeRequest, config: AxiosRequestConfig) => {
      return makeRequest({
        ...config,
        data: config.data * 3 + 1,
      });
    });

    const wrappedAxios = extendAxios(axios, layer);

    const result = await wrappedAxios.request({
      url: '/test',
      method: 'get',
      data: 1,
    });

    expect(layer).toHaveBeenCalledTimes(1);
    expect(result.data).toBe(8);
  });
});
