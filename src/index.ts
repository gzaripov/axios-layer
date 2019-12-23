import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { wrapAxios, AxiosLayer } from './wrap';

export type CreateOpts = {
  layers: AxiosLayer[];
  config?: AxiosRequestConfig;
  axiosInstance?: AxiosInstance;
};

export function create(options: CreateOpts): AxiosInstance {
  const { layers, config, axiosInstance = axios.create(config) } = options;

  layers.forEach((layer) => wrapAxios(axiosInstance, layer));

  return axiosInstance;
}

export * from './wrap';
export default {
  create,
  wrapAxios,
};
