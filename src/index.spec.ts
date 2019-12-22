// import Axios from 'axios';
import { create, AxiosLayer } from '.';
import createTestServer from '../test/test-server';

describe('Axios Wrap Create', () => {
  it('.create should create axios instance and wrap into all layers', async () => {
    const testServer = await createTestServer((req, res) => req.pipe(res));

    const incrementLayer: AxiosLayer = (makeRequest, options) => {
      return makeRequest({
        ...options,
        data: options.data + 1,
      });
    };

    const stringifyLayer: AxiosLayer = (makeRequest, options) => {
      return makeRequest({
        ...options,
        data: JSON.stringify(options.data),
      });
    };

    const axios = create({
      layers: [stringifyLayer, incrementLayer, incrementLayer],
    });

    const response = await testServer.runTask(async () => {
      return axios.post(`${testServer.url}/test`, 1);
    });

    expect(response.data).toBe(3);
  });
});
