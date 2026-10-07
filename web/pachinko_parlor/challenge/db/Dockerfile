FROM postgres:16-alpine

USER postgres

COPY --chown=postgres:postgres init.sql /docker-entrypoint-initdb.d/init.sql
