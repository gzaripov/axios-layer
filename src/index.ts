import axios, { AxiosInstance } from 'axios';
import deepmerge from 'deepmerge';
import { wrapAxios, AxiosLayer, extendAxios, AxiosConfig } from './wrap';

export type CreateOpts<T = unknown> = {
  layers: AxiosLayer<T>[];
  config?: AxiosConfig;
  axiosInstance?: AxiosInstance;
};

export type ExtendableAxios<T = unknown> = AxiosInstance & {
  extend: {
    (...layers: AxiosLayer<T>[]): ExtendableAxios<T>;
    (config: AxiosConfig<T>): ExtendableAxios<T>;
  };
};

const DEEP_MERGE_PROPS = ['headers', 'auth', 'proxy'] as const;

export function createExtendConfigLayer<T>(config: AxiosConfig<T>): AxiosLayer<T> {
  return (makeRequest, options) => {
    const result = { ...config, ...options };

    DEEP_MERGE_PROPS.forEach((prop) => {
      if (config[prop] && options[prop]) {
        result[prop] = deepmerge(config[prop], options[prop]);
      }
    });

    return makeRequest(result);
  };
}

function addExtendMethod<T>(axiosInstance: AxiosInstance): ExtendableAxios<T> {
  const extend = (...args: any[]) => {
    const layers = typeof args[0] === 'object' ? [createExtendConfigLayer(args[0])] : args;

    const extendedAxios = extendAxios(axiosInstance, ...layers);

    return addExtendMethod<T>(extendedAxios);
  };

  return Object.assign(axiosInstance, { extend });
}

export function create<T>(options: CreateOpts<T>) {
  const { layers, config, axiosInstance = axios.create(config) } = options;

  layers.forEach((layer) => wrapAxios(axiosInstance, layer));

  return addExtendMethod<T>(axiosInstance);
}

export * from './wrap';
export * from './layers';
export default {
  create,
  wrapAxios,
};
