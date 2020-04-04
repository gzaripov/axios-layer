import axios, { AxiosInstance } from 'axios';
import deepmerge from 'deepmerge';
import { wrapAxios, AxiosLayer, extendAxios, AxiosConfig, Options } from './wrap';

export type CreateOpts<T = unknown> = {
  layers: AxiosLayer<T>[];
  config?: AxiosConfig<T>;
  axiosInstance?: AxiosInstance;
};

export type ExtendableAxios<T = unknown> = AxiosInstance & {
  extend: {
    (...layers: AxiosLayer<T>[]): ExtendableAxios<T>;
    (config: AxiosConfig<T>): ExtendableAxios<T>;
  };
};

function addExtendMethod<T>(axiosInstance: AxiosInstance): ExtendableAxios<T> {
  const extend = (...args: any[]) => {
    if (typeof args[0] === 'object') {
      const config: AxiosConfig<T> = args[0];
      const extendedAxios = extendAxios(axiosInstance, (makeRequest, options) =>
        makeRequest(deepmerge<Options<T>>(config, options as Partial<Options<T>>)),
      );

      return addExtendMethod<T>(extendedAxios);
    }

    const extendedAxios = extendAxios(axiosInstance, ...args);

    return addExtendMethod<T>(extendedAxios);
  };

  return Object.assign(axiosInstance, { extend });
}

type NoInfer<T> = [T][T extends any ? 0 : never];

export function create<T>(options: CreateOpts<NoInfer<T>>) {
  const { layers, config, axiosInstance = axios.create(config) } = options;

  layers.forEach((layer) => wrapAxios(axiosInstance, layer));

  return addExtendMethod<NoInfer<T>>(axiosInstance);
}

export * from './wrap';
export default {
  create,
  wrapAxios,
};
