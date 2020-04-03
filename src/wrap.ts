import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';

type Options = AxiosRequestConfig & { url: string; method: string; toArgs: () => any[] };

const METHODS_WITH_DATA = ['post', 'put', 'patch'];

const createOptions = (method: string, args: any[]): Options => {
  const dataMethod = METHODS_WITH_DATA.includes(method);
  const optionsIndex = dataMethod ? 2 : args.length - 1;
  const opts = typeof args[optionsIndex] === 'object' ? args[optionsIndex] : {};

  if (method !== 'request' && !opts.method) {
    opts.method = method;
  }

  if (typeof args[0] === 'string') {
    [opts.url] = args;
  }

  if (dataMethod) {
    [, opts.data] = args;
  }

  return {
    ...opts,
    toArgs() {
      if (dataMethod) {
        return [this.url, this.data, this];
      }

      return [this.url, this];
    },
  };
};

type RemoveCallableKeys<Type> = { [Key in keyof Type]: Type[Key] extends Function ? Key : never };
type CallableKeys<Type> = keyof Pick<Type, RemoveCallableKeys<Type>[keyof Type]>;

function wrapAxiosMethod(
  sourceAxiosInstance: AxiosInstance,
  targetAxiosInstance: AxiosInstance,
  method: CallableKeys<AxiosInstance>,
  layerFn: AxiosLayer,
) {
  const requestMethod = sourceAxiosInstance[method] as (...args: any[]) => Promise<any>;

  const wrappedRequest = async (...args: any[]) => {
    const options = createOptions(method, args);

    const makeRequest = (updatedOpts?: Options) =>
      requestMethod(...(updatedOpts || options).toArgs());

    return layerFn(makeRequest, options);
  };

  // @ts-ignore
  // eslint-disable-next-line no-param-reassign
  targetAxiosInstance[method] = wrappedRequest;
}

function cloneAxios(axiosInstance: AxiosInstance) {
  return axios.create(axiosInstance.defaults);
}

const AXIOS_METHODS = ['request', 'get', 'delete', 'head', 'post', 'put', 'patch'] as const;

export type AxiosLayer = (
  makeRequest: (options?: Options) => Promise<any>,
  options: Options,
) => Promise<any>;

export function wrapAxios(axiosInstance: AxiosInstance, ...layers: AxiosLayer[]) {
  layers.forEach((layer) =>
    AXIOS_METHODS.forEach((method) => wrapAxiosMethod(axiosInstance, axiosInstance, method, layer)),
  );
}

export function extendAxios(axiosInstance: AxiosInstance, ...layers: AxiosLayer[]) {
  const axiosClone = cloneAxios(axiosInstance);

  layers.reduce((instance, layer) => {
    AXIOS_METHODS.forEach((method) => wrapAxiosMethod(instance, axiosClone, method, layer));
    return axiosClone;
  }, axiosInstance);

  return axiosClone;
}
