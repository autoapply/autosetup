#!/bin/sh

ROOT="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"

# shellcheck source=common/test-utils.sh
. "${ROOT}/common/test-utils.sh"

namespaces_it() {
    GIT_URL="$(setup_git_server "${ROOT}/resources/namespaces.yaml")" || return 1

    NAMESPACE="$(tmpname)-autoapply"
    autosetup_local \
        -c git.url="${GIT_URL}" \
        -c kubernetes.namespace="${NAMESPACE}" \
        -c 'kubernetes.namespace-access=["it-1","it-2"]' |
        kubectl_local apply -f - || return 1

    waitfor_deployment "it-1" "nginx" 1
    waitfor_deployment "it-2" "nginx" 1
}

run_test namespaces_it
