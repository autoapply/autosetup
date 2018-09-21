# autosetup

Quickly set up [autoapply](https://github.com/pascalgn/autoapply) in a Kubernetes cluster.

## Usage

```bash
$ yarn global add autosetup
$ vi config.yaml
# edit config.yaml as required...
$ autosetup config.yaml output.yaml
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

## License

Autosetup is licensed under the [MIT License](LICENSE)
