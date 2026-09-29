# The one image both processes run. What differs between them is the command:
# the API server runs this file's default, the worker pool overrides it with
# `node scripts/startJobDaemon.js`.

FROM node:24-slim

WORKDIR /app

# Dependencies first, so a change to the source does not reinstall them.
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

# `@openreachtech/renchan-env` looks for a bare `.env` in the working directory under
# NODE_ENV=production and rethrows dotenv's error when it is missing, so the process
# would not start without this file. It is deliberately empty: every real value arrives
# as a process environment variable, which wins over the file. `.dockerignore` keeps the
# repository's own .env.development - which carries values published in a public
# repository - from ever reaching the image.
RUN touch .env

ENV NODE_ENV=production

# The platform assigns the port and passes it in; this is the fallback a local
# `docker run` uses, and it is the port this service has always answered on.
ENV PORT=8001

EXPOSE 8001

CMD ["node", "server/index.js"]
