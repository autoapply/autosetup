#!/bin/sh

if [ ${#} -ne 2 ]; then
    echo "usage: ${0} <namespace> <dir>" >&2
    exit 1
fi

NAMESPACE="${1}"
DIR="${2}"

ROOT="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"

INPUT_FILE="${ROOT}/../resources/git-server.yaml"

KUBECTL="kubectl --context=docker-desktop"

sed "s/%NAMESPACE%/${NAMESPACE}/g" "${INPUT_FILE}" |
    ${KUBECTL} apply -f - >&2 || exit 1

PORT="$(${KUBECTL} -n "${NAMESPACE}" get svc/git -o 'jsonpath={.spec.ports[0].nodePort}')"
REPO_URL="http://localhost:${PORT}/repository.git"
CHECK_URL="${REPO_URL}/info/refs?service=git-upload-pack"

for t in $(seq 1 30); do
    if [ "$t" -eq 30 ]; then
        echo "Server not available!" >&2
        exit 1
    elif curl -s "${CHECK_URL}" >/dev/null; then
        break
    else
        echo "Sleeping..." >&2
        sleep 1
    fi
done

(
    cd "${DIR}" &&
        git init &&
        git config user.name "it" &&
        git config user.email "it@localhost" &&
        git commit --allow-empty -m "initial commit" &&
        ls -l &&
        git add . &&
        git commit -m "add files from ${DIR}" &&
        git remote add origin "${REPO_URL}" &&
        git push origin master
) >&2 || exit 1

echo "${REPO_URL}"
