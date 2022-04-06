# autosetup

[![Build Status](https://img.shields.io/travis/autoapply/autosetup.svg?style=flat-square)](https://travis-ci.org/autoapply/autosetup) [![Docker build status](https://img.shields.io/docker/automated/autoapply/autosetup.svg?style=flat-square)](https://hub.docker.com/r/autoapply/autosetup/) [![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/autoapply/autosetup/blob/main/LICENSE)

Quickly set up [autoapply](https://github.com/autoapply/autoapply) in a Kubernetes cluster.

![Technical overview](https://autoapply.github.io/autosetup/overview.svg)

1. Create a configuration file with the repository URL and required secrets
2. Run autosetup to create Kubernetes resource files based on the configuration file
3. Apply the resource files to your Kubernetes cluster to create the autoapply deployment

## Usage

Run autosetup by using the Docker image `autoapply/autosetup`.

```bash
$ docker run --rm autoapply/autosetup \
    -c git.url=https://github.com/autoapply/template-kubectl \
    -c 'kubernetes.paths=["common","dev"]' \
    -c kubernetes.namespace=autoapply-test \
    > output.yaml
info: All templates successfully generated!
$ cat output.yaml
$ kubectl apply -f output.yaml
```

Alternatively, you can also install it locally using `yarn global add autosetup` or `npm install -g autosetup`.

<p align="center">
  <img  width="800" src="https://autoapply.github.io/autosetup/demo.svg">
</p>

## Configuration

A simple configuration file looks like this:

```yaml
git:
  url: "https://github.com/autoapply/template-kubectl"
kubernetes:
  paths:
    - "common"
    - "dev"
```

For more details, see [example-config.yaml](example-config.yaml).

See [template-kubectl](https://github.com/autoapply/template-kubectl) and [template-kustomize](https://github.com/autoapply/template-kustomize) for example repositories.

### SSH key

The SSH key to access Git repositories can be generated using

```bash
$ ssh-keygen -N '' -m PEM -b 4096 -t rsa -f id_rsa -C autoapply
```

### yaml-crypt keys

A new [yaml-crypt](https://github.com/autoapply/yaml-crypt) key can be generated using

```bash
$ yaml-crypt --generate-key
```

### sops configuration

For information on how to setup sops, see the [documentation](https://github.com/mozilla/sops).

## License

[MIT](LICENSE)
