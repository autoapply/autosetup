#!/bin/sh

set -e

repository="autoapply/autosetup"
platforms="linux/amd64,linux/arm64"

build_docker() {
  version="$1"
  if [ -n "$version" ]; then
    tag="$repository:$version"
    echo "Building $tag..."
    docker buildx build --push --platform="$platforms" . -t "$tag"
  else
    echo "Building..."
    docker buildx build --platform="$platforms" . -t "$tag"
    echo "Skipping docker push for branch '$CIRCLE_BRANCH'"
  fi
}

echo "${DOCKER_PASSWORD}" |
  docker login -u "${DOCKER_USERNAME}" --password-stdin

if [ "$REF_NAME" = "main" ]; then
  build_docker "latest"
elif echo "$REF_NAME" | grep -Eq 'v[0-9]+\.[0-9]+\.[0-9]+'; then
  build_docker "$REF_NAME"
else
  build_docker
fi
