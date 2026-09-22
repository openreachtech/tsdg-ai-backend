#!/bin/bash

# Bring the local middleware up or down for manual verification.
#
#   ./docker.sh start
#   ./docker.sh stop

COMPOSE_FILE='docker-compose.development.yml'
ENV_FILE='.env.development'

case "$1" in
  start)
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --wait
    ;;
  stop)
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    ;;
  *)
    echo 'Usage: ./docker.sh start|stop' >&2
    exit 1
    ;;
esac
