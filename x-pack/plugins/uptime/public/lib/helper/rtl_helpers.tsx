/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { ReactElement, ReactNode } from 'react';
import { of } from 'rxjs';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  render as reactTestLibRender,
  MatcherFunction,
  RenderOptions,
  Nullish,
} from '@testing-library/react';
import { Router } from 'react-router-dom';
import { merge } from 'lodash';
import { createMemoryHistory, History } from 'history';
import { CoreStart } from 'kibana/public';
import { I18nProvider } from '@kbn/i18n-react';
import { EuiPageTemplate } from '@elastic/eui';
import { coreMock } from 'src/core/public/mocks';
// eslint-disable-next-line import/no-extraneous-dependencies
import { configure } from '@testing-library/dom';
import { mockState } from '../__mocks__/uptime_store.mock';
import { EuiThemeProvider } from '../../../../../../src/plugins/kibana_react/common';
import { IStorageWrapper } from '../../../../../../src/plugins/kibana_utils/public';
import {
  KibanaContextProvider,
  KibanaServices,
} from '../../../../../../src/plugins/kibana_react/public';
import { MountWithReduxProvider } from './helper_with_redux';
import { AppState } from '../../state';
import { stringifyUrlParams } from './stringify_url_params';
import { ClientPluginsStart } from '../../apps/plugin';
import { triggersActionsUiMock } from '../../../../triggers_actions_ui/public/mocks';
import { dataPluginMock } from '../../../../../../src/plugins/data/public/mocks';
import { UptimeRefreshContextProvider, UptimeStartupPluginsContextProvider } from '../../contexts';

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

interface KibanaProps {
  services?: KibanaServices;
}

export interface KibanaProviderOptions<ExtraCore> {
  core?: DeepPartial<CoreStart> & Partial<ExtraCore>;
  kibanaProps?: KibanaProps;
}

interface MockKibanaProviderProps<ExtraCore> extends KibanaProviderOptions<ExtraCore> {
  children: ReactElement | ReactNode;
}

interface MockRouterProps<ExtraCore> extends MockKibanaProviderProps<ExtraCore> {
  history?: History;
}

type Url =
  | string
  | {
      path: string;
      queryParams: Record<string, string | number>;
    };

interface RenderRouterOptions<ExtraCore> extends KibanaProviderOptions<ExtraCore> {
  history?: History;
  renderOptions?: Omit<RenderOptions, 'queries'>;
  state?: Partial<AppState> | DeepPartial<AppState>;
  url?: Url;
}

function getSetting<T = any>(key: string): T {
  return 'MMM D, YYYY @ HH:mm:ss.SSS' as unknown as T;
}

function setSetting$<T = any>(key: string): T {
  return of('MMM D, YYYY @ HH:mm:ss.SSS') as unknown as T;
}

const createMockStore = () => {
  let store: Record<string, any> = {};
  return {
    get: jest.fn().mockImplementation((key) => store[key]),
    set: jest.fn().mockImplementation((key, value) => (store[key] = value)),
    remove: jest.fn().mockImplementation((key: string) => delete store[key]),
    clear: jest.fn().mockImplementation(() => (store = {})),
  };
};

const mockAppUrls: Record<string, string> = {
  uptime: '/app/uptime',
  observability: '/app/observability',
  '/home#/tutorial/uptimeMonitors': '/home#/tutorial/uptimeMonitors',
};

/* default mock core */
const defaultCore = coreMock.createStart();
const mockCore: () => Partial<CoreStart> = () => {
  const core: Partial<CoreStart & ClientPluginsStart & { storage: IStorageWrapper }> = {
    ...defaultCore,
    application: {
      ...defaultCore.application,
      getUrlForApp: (app: string) => mockAppUrls[app],
      navigateToUrl: jest.fn(),
      capabilities: {
        ...defaultCore.application.capabilities,
        uptime: {
          'alerting:save': true,
          configureSettings: true,
          save: true,
          show: true,
        },
      },
    },
    uiSettings: {
      ...defaultCore.uiSettings,
      get: getSetting,
      get$: setSetting$,
    },
    triggersActionsUi: triggersActionsUiMock.createStart(),
    storage: createMockStore(),
    data: dataPluginMock.createStartContract(),
    observability: {
      navigation: {
        // @ts-ignore
        PageTemplate: EuiPageTemplate,
      },
      ExploratoryViewEmbeddable: () => <div>Embeddable exploratory view</div>,
    },
  };

  return core;
};

/* Mock Provider Components */
export function MockKibanaProvider<ExtraCore>({
  children,
  core,
  kibanaProps,
}: MockKibanaProviderProps<ExtraCore>) {
  const coreOptions = merge({}, mockCore(), core);

  return (
    <KibanaContextProvider services={{ ...coreOptions }} {...kibanaProps}>
      <UptimeRefreshContextProvider>
        <UptimeStartupPluginsContextProvider
          data={(coreOptions as any).data}
          observability={(coreOptions as any).observability}
        >
          <EuiThemeProvider darkMode={false}>
            <I18nProvider>{children}</I18nProvider>
          </EuiThemeProvider>
        </UptimeStartupPluginsContextProvider>
      </UptimeRefreshContextProvider>
    </KibanaContextProvider>
  );
}

export function MockRouter<ExtraCore>({
  children,
  core,
  history = createMemoryHistory(),
  kibanaProps,
}: MockRouterProps<ExtraCore>) {
  return (
    <Router history={history}>
      <MockKibanaProvider core={core} kibanaProps={kibanaProps}>
        {children}
      </MockKibanaProvider>
    </Router>
  );
}
configure({ testIdAttribute: 'data-test-subj' });

export const MockRedux = ({
  state,
  history = createMemoryHistory(),
  children,
}: {
  state: Partial<AppState>;
  history?: History;
  children: React.ReactNode;
}) => {
  const testState: AppState = {
    ...mockState,
    ...state,
  };

  return (
    <MountWithReduxProvider state={testState}>
      <MockRouter history={history}>{children}</MockRouter>
    </MountWithReduxProvider>
  );
};

/* Custom react testing library render */
export function render<ExtraCore>(
  ui: ReactElement,
  {
    history = createMemoryHistory(),
    core,
    kibanaProps,
    renderOptions,
    state,
    url,
  }: RenderRouterOptions<ExtraCore> = {}
) {
  const testState: AppState = merge({}, mockState, state);

  if (url) {
    history = getHistoryFromUrl(url);
  }

  return {
    ...reactTestLibRender(
      <MountWithReduxProvider state={testState}>
        <MockRouter history={history} kibanaProps={kibanaProps} core={core}>
          {ui}
        </MockRouter>
      </MountWithReduxProvider>,
      renderOptions
    ),
    history,
  };
}

const getHistoryFromUrl = (url: Url) => {
  if (typeof url === 'string') {
    return createMemoryHistory({
      initialEntries: [url],
    });
  }

  return createMemoryHistory({
    initialEntries: [url.path + stringifyUrlParams(url.queryParams)],
  });
};

// This function allows us to query for the nearest button with test
// no matter whether it has nested tags or not (as EuiButton elements do).
export const forNearestButton =
  (getByText: (f: MatcherFunction) => HTMLElement | null) =>
  (text: string): HTMLElement | null =>
    getByText((_content: string, node: Nullish<Element>) => {
      if (!node) return false;
      const noOtherButtonHasText = Array.from(node.children).every(
        (child) => child && (child.textContent !== text || child.tagName.toLowerCase() !== 'button')
      );
      return (
        noOtherButtonHasText && node.textContent === text && node.tagName.toLowerCase() === 'button'
      );
    });

export const makeUptimePermissionsCore = (
  permissions: Partial<{
    'alerting:save': boolean;
    configureSettings: boolean;
    save: boolean;
    show: boolean;
  }>
) => {
  return {
    application: {
      capabilities: {
        uptime: {
          'alerting:save': true,
          configureSettings: true,
          save: true,
          show: true,
          ...permissions,
        },
      },
    },
  };
};
