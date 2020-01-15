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
<% if (ctx.config.kubernetes['cluster-admin']) { -%>
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: autoapply
  labels:
    component: autoapply
subjects:
- kind: ServiceAccount
  name: autoapply
  namespace: '<%- ctx.config.kubernetes.namespace %>'
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
<% } else { -%>
<%   for (const namespace of ctx.accessNamespaces) { -%>
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: autoapply
  namespace: '<%- namespace %>'
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
  namespace: '<%- namespace %>'
  labels:
    component: autoapply
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: autoapply
subjects:
- kind: ServiceAccount
  name: autoapply
<%     if (ctx.config.kubernetes.namespace !== namespace) { -%>
  namespace: '<%- ctx.config.kubernetes.namespace %>'
<%     } -%>
<%   } -%>
<% } -%>
