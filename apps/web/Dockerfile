###############################################################################
# Step 1 : Builder image (all packages, builds the Next.js app)
#
FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .

# Next.js puts NEXT_PUBLIC_* into the browser code at build time.
# The API address comes from this build argument when it is given, otherwise from .env.production.
ARG NEXT_PUBLIC_API_URL
# Only for a demo installation: shows the demo accounts on the login page
ARG NEXT_PUBLIC_DEMO_PASSWORD
ENV NEXT_OUTPUT=standalone
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

###############################################################################
# Step 2 : Run image (only the standalone server and static files)
#
FROM node:24-alpine

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

CMD ["node", "server.js"]
