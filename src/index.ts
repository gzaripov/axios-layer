import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import deepmerge from 'deepmerge';
import { wrapAxios, AxiosLayer, extendAxios, Options } from './wrap';

export type CreateOpts = {
  layers: AxiosLayer[];
  config?: AxiosRequestConfig;
  axiosInstance?: AxiosInstance;
};

type ExtendableAxios = AxiosInstance & {
  extend: {
    (...layers: AxiosLayer[]): ExtendableAxios;
    (config: AxiosRequestConfig): ExtendableAxios;
  };
};

function addExtendMethod(axiosInstance: AxiosInstance): ExtendableAxios {
  const extend = (...args: any[]) => {
    if (typeof args[0] === 'object') {
      const config: AxiosRequestConfig = args[0];
      const extendedAxios = extendAxios(axiosInstance, (makeRequest, options) =>
        makeRequest(deepmerge<Options>(config, options)),
      );

      return addExtendMethod(extendedAxios);
    }

    const extendedAxios = extendAxios(axiosInstance, ...args);

    return addExtendMethod(extendedAxios);
  };

  return Object.assign(axiosInstance, { extend });
}

export function create(options: CreateOpts) {
  const { layers, config, axiosInstance = axios.create(config) } = options;

  layers.forEach((layer) => wrapAxios(axiosInstance, layer));

  return addExtendMethod(axiosInstance);
}

export * from './wrap';
export default {
  create,
  wrapAxios,
};
