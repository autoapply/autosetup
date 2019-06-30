#!/bin/bash

set -e

NOW=$(date +"%Y%m%d%H%M%S")
NAMESPACE="demo-${NOW}"

KUBECTL="kubectl-1.14 -n ${NAMESPACE}"

function main() {
    prompt

    sleep 1

    print "kubectl get all"
    ${KUBECTL} get all
    prompt

    sleep 2

    print "docker run --rm autoapply/autosetup \\"
    print "    -c git.url=https://github.com/autoapply/template-kubectl \\"
    print "    -c git.path=prod \\"
    print "    | kubectl apply -f -"

    sleep .5

    echo "info: All templates successfully generated!"

    sleep .5

    prompt

    sleep .5

    (sleep 2 && docker run --rm autoapply/autosetup \
        -c git.url=https://github.com/autoapply/template-kubectl \
        -c git.path=prod \
        -c kubernetes.namespace="${NAMESPACE}" 2>/dev/null \
        | ${KUBECTL} apply -f - &>/dev/null) &

    (sleep 20 && killall watch &>/dev/null) &

    print "watch kubectl get all"
    sleep .5
    watch -t -n .2 ${KUBECTL} get all

    clear
    sleep 3
    echo

    ${KUBECTL} delete --wait=false ns "${NAMESPACE}" &>/dev/null
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
