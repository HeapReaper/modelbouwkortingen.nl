#!/bin/sh
# Past de Prisma-migraties toe (eenmalige `migrate` service in docker-compose).
#
# Databases die nog door de oude crawler-migraties zijn aangemaakt hebben de tabellen
# al, maar geen Prisma-historie; `migrate deploy` faalt dan met P3005. In dat geval
# markeren we de init-migratie als toegepast (baseline) en draaien we deploy opnieuw.
set -e

if out=$(npx prisma migrate deploy 2>&1); then
  echo "$out"
  exit 0
fi
echo "$out"

case "$out" in
  *P3005*) ;;
  *) exit 1 ;;
esac

init=$(ls -1 prisma/migrations | grep -v '\.toml$' | sort | head -n 1)
echo "Bestaande database zonder Prisma-historie: baseline met migratie '$init'."
npx prisma migrate resolve --applied "$init"
npx prisma migrate deploy
