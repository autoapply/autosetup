#!/bin/sh

repository="autoapply/autosetup"

build_docker() {
  version="$1"
  if [ -n "$version" ]; then
    tag="$repository:$version"
    echo "Building $tag..."
    docker build . -t "$tag" || exit 1
    docker push "$tag" || exit 1
  else
    echo "Building..."
    docker build . || exit 1
    echo "Skipping docker push for branch '$CIRCLE_BRANCH'"
  fi
}

echo "${DOCKER_PASSWORD}" |
  docker login -u "${DOCKER_USERNAME}" --password-stdin || exit 1

if [ -n "$CIRCLE_TAG" ]; then
  build_docker "$CIRCLE_TAG"
elif [ "$CIRCLE_BRANCH" = "main" ]; then
  build_docker "latest"
else
  build_docker
fi
