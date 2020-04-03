import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
// @ts-ignore
import { deepMerge } from 'axios/lib/utils';
import { wrapAxios, AxiosLayer, extendAxios } from './wrap';

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
        makeRequest(deepMerge(config, options)),
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
