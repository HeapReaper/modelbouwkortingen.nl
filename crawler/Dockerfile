# Crawler (Go) — multi-stage build naar een klein, statisch binary.
# Bouwen (vanuit de map crawler/):  docker build -t modelbouwkortingen-crawler .
FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/crawler ./cmd/crawler

FROM alpine:3.22
RUN apk add --no-cache ca-certificates tzdata && adduser -S -u 1001 crawler
ENV TZ=Europe/Amsterdam \
    CRAWLER_HTTP_ADDR=:8080 \
    LOG_FORMAT=json
COPY --from=build /out/crawler /usr/local/bin/crawler
USER crawler
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["crawler"]
