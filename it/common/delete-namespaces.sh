#!/bin/sh

KUBECTL_ARGS="--context=docker-desktop"

kubectl "${KUBECTL_ARGS}" get namespace \
    --field-selector='status.phase=Active' -o name |
    grep -E "^namespace/it-" |
    xargs kubectl "${KUBECTL_ARGS}" delete --wait=false
