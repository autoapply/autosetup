#!/bin/bash

set -e

NOW=$(date +"%Y%m%d%H%M%S")
NAMESPACE="demo-${NOW}"

function main() {
    prompt

    sleep 1

    print "kubectl get all"
    _kubectl get all
    prompt

    sleep 2

    print "docker run --rm autoapply/autosetup \\"
    print "       -c deployment.repository=https://github.com/autoapply/autoapply \\"
    print "       -c deployment.path=docs/examples/nginx.yaml \\"
    print "       | kubectl apply -f -"

    docker run --rm autoapply/autosetup \
        -c deployment.repository=https://github.com/autoapply/autoapply \
        -c deployment.path=docs/examples/nginx.yaml \
        -c deployment.namespace="${NAMESPACE}" \
        | _kubectl apply -f - &>/dev/null
    prompt

    sleep .5

    (sleep 15 && killall watch &>/dev/null) &

    print "watch kubectl get all"
    sleep .5
    watch -t -n .2 kubectl -n "${NAMESPACE}" get all

    clear
    sleep 3
    echo

    kubectl delete --wait=false ns "${NAMESPACE}" &>/dev/null
}

function _kubectl() {
    kubectl -n "${NAMESPACE}" $@
}

function prompt() {
    printf "\e[34m~ \e[32m❯\e[0m "
}

function print() {
    TEXT=${1#_}
    for i in $(seq 1 ${#TEXT}); do
        CHAR="${TEXT:i-1:1}"
        if [[ "${CHAR}" != " " ]]; then
            sleep .05
        fi
        printf "%s" "${CHAR}"
    done
    echo
}

main
