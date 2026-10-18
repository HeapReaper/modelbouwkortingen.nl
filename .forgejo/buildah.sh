#!/bin/sh
# Bouwt een image met Buildah en pusht het naar het containerregister van Codeberg.
# De runners van Codeberg hebben geen Docker daemon; Buildah werkt daar rootless met vfs.
#
# Gebruik: buildah.sh <naam> <context> [extra opties voor `buildah build`]
# Env: REGISTRY_OWNER, REGISTRY_TOKEN (alleen met PUSH=true), GITHUB_SHA, PUSH.
set -eu

name=$1
context=$2
shift 2

registry=codeberg.org
owner=$(echo "$REGISTRY_OWNER" | tr '[:upper:]' '[:lower:]')
image="$registry/$owner/modelbouwkortingen-$name"
short=$(echo "$GITHUB_SHA" | cut -c1-7)

echo root:1:65536 > /etc/subuid
cp /etc/subuid /etc/subgid
mkdir -p /etc/containers
printf '[storage]\ndriver="vfs"\nrunroot="/run/containers/storage"\ngraphroot="/var/lib/containers/storage"\n' \
  > /etc/containers/storage.conf
export BUILDAH_ISOLATION=chroot

buildah build \
  --tag "$image:sha-$short" \
  --tag "$image:latest" \
  --label "org.opencontainers.image.source=https://codeberg.org/HeapReaper/modelbouwkortingen.nl" \
  --label "org.opencontainers.image.revision=$GITHUB_SHA" \
  "$@" "$context"

if [ "${PUSH:-false}" = true ]; then
  echo "$REGISTRY_TOKEN" | buildah login -u "$owner" --password-stdin "$registry"
  buildah push "$image:sha-$short"
  buildah push "$image:latest"
fi
