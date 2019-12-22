import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';

export type AxiosMock = AxiosInstance & { mock: MockAdapter };
export type CreateAxiosMockOpts = AxiosRequestConfig & { delayResponse?: number };

export function createAxiosMock({
  delayResponse = 0,
  ...axiosConfig
}: CreateAxiosMockOpts = {}): AxiosMock {
  const axiosInstance = axios.create(axiosConfig) as AxiosMock;
  const mock = new MockAdapter(axiosInstance, { delayResponse });

  axiosInstance.mock = mock;

  return axiosInstance;
}
