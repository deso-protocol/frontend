#!/bin/sh

echo "Loading Caddy config from file: ${CADDY_FILE}"

caddy run --config ${CADDY_FILE}
