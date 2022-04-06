#!/bin/sh

if [ ! -d "${ROOT}" ] || [ ! -d "${ROOT}/../.git" ]; then
    echo "error: environment variable \${ROOT} invalid or not set!" >&2
    exit 1
fi

kubectl_local() {
    kubectl --context=docker-desktop "${@}"
}

autosetup_local() {
    "${ROOT}/../bin/autosetup-cli.js" -c git.args='' "${@}"
}

delete_namespaces() {
    "${ROOT}/common/delete-namespaces.sh" "${@}"
}

setup_git_server() {
    TEMP_DIR="${TMPDIR:-/tmp}/$(tmpname)"
    mkdir "${TEMP_DIR}" || return 1

    cp "${@}" "${TEMP_DIR}" || return 1

    NAMESPACE="$(tmpname)-git"
    "${ROOT}/common/setup-git-server.sh" "${NAMESPACE}" "${TEMP_DIR}" >&2 ||
        return 1

    rm -rf "${TEMP_DIR}" || return 1

    echo "http://git.${NAMESPACE}.svc.cluster.local:3000/repository.git"
}

waitfor() {
    timeout=30
    for t in $(seq 1 $timeout); do
        if [ "$t" -eq "$timeout" ]; then
            echo "Timeout!" >&2
            return 1
        elif eval "${@}"; then
            return 0
        else
            echo "Sleeping..." >&2
            sleep 1
        fi
    done
    return 1
}

waitfor_deployment() {
    waitfor "kubectl_local --namespace '${1}' get deployment.apps/${2} \
        -o 'jsonpath={.status.availableReplicas}' 2>/dev/null | grep -q '${3}'"
}

tmpname() {
    echo "it-$(date +%Y%m%d%H%M%S)"
}

show_log_output() {
    namespaces=$(kubectl_local get namespace -o name | sed -En 's,.+/(it-.+-autoapply),\1,p')
    for namespace in $namespaces; do
        kubectl_local --namespace "$namespace" logs deploy/autoapply
    done
}

CFR="\033[31m"
CFG="\033[32m"
CFB="\033[34m"
CFC="\033[36m"
CRT="\033[0m"

run_test() {
    # shellcheck disable=SC2059
    printf "${CFB}Running test ${CFC}${1}${CFB} ... ${CRT}\n"
    if "${@}"; then
        RESULT=0
    else
        show_log_output
        RESULT=1
    fi
    delete_namespaces "${@}" || return 1
    if [ "${RESULT}" -eq 0 ]; then
        # shellcheck disable=SC2059
        printf "${CFG}Test finished successfully!${CRT}\n"
    else
        # shellcheck disable=SC2059
        printf "${CFR}Test failed!${CRT}\n"
    fi
    return ${RESULT}
}
