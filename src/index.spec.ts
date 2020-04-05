import { create, AxiosLayer } from '.';
import createTestServer from '../test/test-server';

describe('Axios Create', () => {
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

    const transport = create({
      layers: [stringifyLayer, incrementLayer, incrementLayer],
    });

    const response = await testServer.runTask(async () => {
      return transport.post(`${testServer.url}/test`, 1);
    });

    expect(response.data).toBe(3);
  });

  it('.extend shoud work with axios request config', async () => {
    const transport = create({
      layers: [],
      config: {
        headers: {
          'x-test-header': '1',
          'x-test-header-2': '2',
        },
      },
    });
    const childTransport = transport.extend({
      headers: {
        'x-test-header': '123',
      },
    });

    const testServer = await createTestServer();

    const response = await testServer.runTask(() => transport.get(`${testServer.url}/test`));
    const childResponse = await testServer.runTask(() =>
      childTransport.get(`${testServer.url}/test`),
    );

    expect(response.config.headers['x-test-header']).toBe('1');
    expect(response.config.headers['x-test-header-2']).toBe('2');

    expect(childResponse.config.headers['x-test-header']).toBe('123');
    expect(childResponse.config.headers['x-test-header-2']).toBe('2');
  });

  it('.extend shoud work with one layer', async () => {
    const transport = create({
      layers: [],
    });
    const childTransport = transport.extend((makeRequest, options) =>
      makeRequest({
        headers: {
          ...options.headers,
          'x-test-header': '123',
        },
        ...options,
      }),
    );

    const testServer = await createTestServer();

    const response = await testServer.runTask(() => transport.get(`${testServer.url}/test`));
    const childResponse = await testServer.runTask(() =>
      childTransport.get(`${testServer.url}/test`),
    );

    expect(response.config.headers['x-test-header']).not.toBeDefined();
    expect(childResponse.config.headers['x-test-header']).toBe('123');
  });

  it('.extend shoud work with several layers', async () => {
    const transport = create({
      layers: [],
    });
    const childTransport = transport.extend(
      (makeRequest, options) =>
        makeRequest({
          ...options,
          headers: {
            'x-test-header': '123',
            ...options.headers,
          },
        }),
      (makeRequest, options) =>
        makeRequest({
          ...options,
          headers: {
            'x-test-header-3': '1234',
            ...options.headers,
          },
        }),
    );

    const testServer = await createTestServer();

    const response = await testServer.runTask(() => transport.get(`${testServer.url}/test`));
    const childResponse = await testServer.runTask(() =>
      childTransport.get(`${testServer.url}/test`),
    );

    expect(response.config.headers['x-test-header']).not.toBeDefined();

    expect(childResponse.config.headers['x-test-header']).toBe('123');
    expect(childResponse.config.headers['x-test-header-3']).toBe('1234');
  });

  it('.extend shoud return intance with .extend', async () => {
    const transport = create({
      layers: [],
    });
    const childTransport = transport
      .extend((makeRequest, options) =>
        makeRequest({
          ...options,
          headers: {
            'x-test-header': '123',
            ...options.headers,
          },
        }),
      )
      .extend((makeRequest, options) =>
        makeRequest({
          ...options,
          headers: {
            'x-test-header-3': '1234',
            ...options.headers,
          },
        }),
      );

    const testServer = await createTestServer();

    const response = await testServer.runTask(() => transport.get(`${testServer.url}/test`));
    const childResponse = await testServer.runTask(() =>
      childTransport.get(`${testServer.url}/test`),
    );

    expect(response.config.headers['x-test-header']).not.toBeDefined();

    expect(childResponse.config.headers['x-test-header']).toBe('123');
    expect(childResponse.config.headers['x-test-header-3']).toBe('1234');
  });

  it('.extend shoud not deepmerge custom params', async () => {
    const testObject = {
      a: 2,
      test() {
        return this.a;
      },
    };

    const transport = create<{ testObject: typeof testObject }>({
      layers: [],
    })
      .extend((makeRequest, options) => {
        return makeRequest({
          ...options,
          headers: {
            ...options.headers,
            'x-test-header': options.testObject === testObject,
          },
        });
      })
      .extend({
        testObject,
      });

    const testServer = await createTestServer();

    const response = await testServer.runTask(() => transport.get(`${testServer.url}/test`));

    expect(response.config.headers['x-test-header']).toBe(true);
  });

  it('.extend shoud merge headers', async () => {
    const transport = create({
      layers: [],
      config: {
        headers: {
          'x-test-header-1': '1',
          'x-test-header-2': '1',
          'x-test-header-3': '1',
        },
      },
    });

    const childTransport = transport.extend({
      headers: {
        'x-test-header-1': '2',
        'x-test-header-2': '2',
      },
    });

    const testServer = await createTestServer();

    const response = await testServer.runTask(() =>
      transport.get(`${testServer.url}/test`, {
        headers: {
          'x-test-header-1': '3',
        },
      }),
    );

    expect(response.config.headers['x-test-header-1']).toBe('3');
    expect(response.config.headers['x-test-header-2']).toBe('1');
    expect(response.config.headers['x-test-header-3']).toBe('1');

    const childResponse = await testServer.runTask(() =>
      childTransport.get(`${testServer.url}/test`, {
        headers: {
          'x-test-header-1': '3',
        },
      }),
    );

    expect(childResponse.config.headers['x-test-header-1']).toBe('3');
    expect(childResponse.config.headers['x-test-header-2']).toBe('2');
    expect(childResponse.config.headers['x-test-header-3']).toBe('1');
  });
});
