<% if (ctx.dockercfg) { -%>
apiVersion: v1
kind: Secret
metadata:
  name: autoapply-dockercfg
  namespace: '<%- ctx.config.kubernetes.namespace %>'
  labels:
    component: autoapply
<% for (const [name, value] of Object.entries(ctx.config.kubernetes.labels)) { -%>
    <%- name %>: '<%- value %>'
<% } -%>
<% if (Object.keys(ctx.config.kubernetes.annotations).length > 0) { -%>
  annotations:
<%   for (const [name, value] of Object.entries(ctx.config.kubernetes.annotations)) { -%>
    <%- name %>: '<%- value %>'
<%   } -%>
<% } -%>
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <%- ctx.dockercfg %>
<% } -%>
