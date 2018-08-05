apiVersion: v1
kind: ServiceAccount
metadata:
  name: autoapply
  namespace: '<%= ctx.deployment.namespace %>'
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: Role
metadata:
  name: autoapply
  namespace: '<%= ctx.deployment.namespace %>'
rules:
- apiGroups: ['*']
  resources: ['*']
  verbs: ['*']
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: RoleBinding
metadata:
  name: autoapply
  namespace: '<%= ctx.deployment.namespace %>'
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: autoapply
subjects:
- kind: ServiceAccount
  name: autoapply
