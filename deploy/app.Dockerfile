# App SAVORA (TanStack Start) como servidor Node autonomo.
#
# NITRO_PRESET=node-server e o que tira a dependencia do Lovable: o build
# passa a gerar .output/server/index.mjs em vez de um bundle para a
# plataforma deles.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
ENV NITRO_PRESET=node-server
RUN npx vite build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/.output ./.output
RUN useradd --create-home --shell /usr/sbin/nologin app && chown -R app:app /app
USER app
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
