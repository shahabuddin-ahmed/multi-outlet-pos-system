###############################################################################
# Step 1 : Builder image (all packages, compiles TypeScript to dist/)
#
FROM node:24-alpine AS builder

WORKDIR /home/node/app
COPY . .
RUN yarn install --frozen-lockfile && yarn run build

###############################################################################
# Step 2 : Run image (production packages and compiled code only)
#
FROM node:24-alpine

ARG PORT

ENV NODE_ENV production
WORKDIR /home/node/app

COPY --from=builder /home/node/app/package.json /home/node/app/yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean
COPY --from=builder /home/node/app/dist ./dist

# The app runs as the unprivileged "node" user
USER node

EXPOSE ${PORT}

# Settings and secrets (POSTGRES_*, ...) are passed in at runtime, never built into the image.
# Update the tables and default data (and demo data when SEED_DEMO_DATA is true), then start the API.
# "exec" replaces the shell, so the stop signal reaches Node and it can close its connections.
CMD ["sh", "-c", "yarn db:migrate:prod && yarn db:seed:prod && yarn demo:seed:prod && exec node dist/server.js"]
