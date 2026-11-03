# The website in local mode (CV, print CV, portfolio and the job hunt board),
# served by `next dev`. Local only: compose publishes the port on 127.0.0.1.
#
# Built through the DevTools mirror: the approved Node image and npm registry
# (compose passes the registry as a build arg). Packages install from the
# names-only deploy/package.json, so the mirror's approved list decides the
# versions; the public site's build keeps the pinned root package.json.
ARG NODE_IMAGE=localhost:5000/node
FROM ${NODE_IMAGE}

ARG NPM_CONFIG_REGISTRY
ENV NPM_CONFIG_REGISTRY=${NPM_CONFIG_REGISTRY} \
    CV_MODE=local \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app
COPY deploy/package.json package.json
RUN npm install --no-audit --no-fund --no-package-lock

COPY . .
# data/ is bind-mounted at /app/data by compose, never copied in

EXPOSE 3000
CMD ["sh", "-c", "node scripts/sync-media.mjs && npx next dev -H 0.0.0.0 -p 3000"]
