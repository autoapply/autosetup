apiVersion: v1
kind: ServiceAccount
metadata:
  name: autoapply
  namespace: '<%- ctx.config.kubernetes.namespace %>'
  labels:
    component: autoapply
<% if (ctx.dockercfg) { -%>
imagePullSecrets:
  - name: autoapply-dockercfg
<% } -%>
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: autoapply
  namespace: '<%- ctx.config.kubernetes.namespace %>'
  labels:
    component: autoapply
rules:
- apiGroups: ['*']
  resources: ['*']
  verbs: ['*']
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: autoapply
  namespace: '<%- ctx.config.kubernetes.namespace %>'
  labels:
    component: autoapply
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: autoapply
subjects:
- kind: ServiceAccount
  name: autoapply
