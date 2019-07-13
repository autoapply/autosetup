#!/bin/sh

ROOT="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"

# shellcheck source=common/test-utils.sh
. "${ROOT}/common/test-utils.sh"

simple_it() {
    GIT_URL="$(setup_git_server "${ROOT}/resources/simple.yaml")" || return 1

    NAMESPACE="$(tmpname)-autoapply"
    autosetup_local \
        -c git.url="${GIT_URL}" \
        -c kubernetes.namespace="${NAMESPACE}" |
        kubectl_local apply -f - || return 1

    waitfor_deployment "${NAMESPACE}" "nginx" 1
}

run_test simple_it
