<% if (ctx.dockercfg) { -%>
apiVersion: v1
kind: Secret
metadata:
  name: autoapply-dockercfg
  namespace: '<%- ctx.config.kubernetes.namespace %>'
  labels:
    component: autoapply
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <%- ctx.dockercfg %>
<% } -%>
