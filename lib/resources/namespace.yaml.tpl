<% if (ctx.config.kubernetes.namespace !== "default") { -%>
apiVersion: v1
kind: Namespace
metadata:
  name: '<%- ctx.config.kubernetes.namespace %>'
<% } -%>
