# autosetup

[![Build Status](https://img.shields.io/travis/autoapply/autosetup.svg?style=flat-square)](https://travis-ci.org/autoapply/autosetup) [![Docker build status](https://img.shields.io/docker/build/autoapply/autosetup.svg?style=flat-square)](https://hub.docker.com/r/autoapply/autosetup/) [![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/autoapply/autosetup/blob/master/LICENSE)

Quickly set up [autoapply](https://github.com/autoapply/autoapply) in a Kubernetes cluster.

<img src="https://autoapply.github.io/autosetup/demo.svg" width="600">

## Usage

```bash
$ yarn global add autosetup
$ vi config.yaml
# edit config.yaml as required...
$ autosetup -o output.yaml config.yaml
$ cat output.yaml
$ kubectl apply -f output.yaml
```

## Configuration

A basic configuration file looks like this:

```yaml
deployment:
  repository: 'https://github.com/kubernetes/examples'
  path: 'guestbook/all-in-one'
```

For more details, see [example-config.yaml](example-config.yaml).

## Docker

To run with Docker, use `docker run --rm -it autoapply/autosetup --help`

## License

Autosetup is licensed under the [MIT License](LICENSE)
