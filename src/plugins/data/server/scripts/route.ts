/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { IRouter } from 'kibana/server';

export function registerScriptsRoute(router: IRouter) {
  router.get(
    { path: '/api/kibana/scripts/languages', validate: false },
    async (context, request, response) => {
      return response.ok({
        body: ['painless', 'expression'],
      });
    }
  );

  router.get(
    { path: `/newterms/{id}`, validate: false },
    async (context, request, response) => {
      const data = await context.core.elasticsearch.client.asInternalUser.search({
        index: "newterms",
        body: {
          query: {
            match_all: {},
          },
          size: 1000,
        },
      });
      return response.ok({
        body: data,
      });
    }
  );
}
