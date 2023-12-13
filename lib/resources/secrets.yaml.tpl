<% if (Object.keys(ctx.secrets).length > 0) { -%>
apiVersion: v1
kind: Secret
metadata:
  name: autoapply-secret
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
type: Opaque
data:
<%   for (const [key, value] of Object.entries(ctx.secrets)) { -%>
  <%- key %>: '<%- value %>'
<%   } -%>
<% } -%>
