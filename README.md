# Axios Layer

Middleware tool for extending basic axios functionality

## Installation

```
npm i axios-layer
yarn add axios-layer
```

## Problem

You need to add some complex functionality to axios,
like router that make request to different domains dependent on environment or you need to add logging to axios,
you also want to write tests on these modules and share them between projects

## Usage

```javascript
import axiosLayer from 'axios-layer';
import pino from 'pino';

const logger = pino();

const formatAxiosError = (error, options) => {
  // by default axios doesnt provide informative error object
  // so make a nice one
};

// makeRequest will call next layer or axios itself, you can call it several times
// options is AxiosRequestConfig object, it is optional
const loggerLayer = ({ logger }) => (makeRequest, options) => {
  logger.info(`Making request to ${options.url}, method: ${options.method}, data: ${options.data}`);

  // options are optional, they are passed by default,
  // use them if you need to change something in options object
  return makeRequest(options).catch((error) => {
    logger.error(formatAxiosError(error, options));

    return Promise.reject(error);
  });
};

axiosLayer.create({
  layers: [loggerLayer({ logger })],
});
```

## Api

### create(options)

Create a new instance or used provided and wrap it up in passed layers

Options:

| Name            | Type                 | Description                                                                                                                           | Default                        |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| _layers_        | `AxiosLayer[]`       | Array of AxiosLayer, this is the only required option                                                                                 |                                |
| _config_        | `AxiosRequestConfig` | Axios Config for creating new instance, peer axios dependency is used                                                                 | `undefined`                    |
| _axiosInstance_ | `AxiosInstance`      | Axios Instance (to create instance use axios.create() method), peer axios dependency will be used by default to create axios instance | `axios.create(options.config)` |

### AxiosLayer

```typescript
type AxiosLayer = (
  makeRequest: (options?: Options) => Promise<any>,
  options: Options,
) => Promise<any>;
```

Layer should return a promise, you can omit options object in makeRequest()

### wrapAxios(axios, layer)

function that `axiosLayer.create()` use inside, allows you to apply layer on axios instance

## Tesing

check out `/test` directory in source code, there are two helpers that allows you to write unit and integration tests.

`createAxiosMock` creates axios instance with `mock` property that is just axios-mock-adapter

`createTestServer` creates server that will listen on free port and close it after test if you use `.runTask` function, also you can provide your own controller function

## Licence

MIT
