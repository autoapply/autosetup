<% if (ctx.deployment.namespace !== "default") { -%>
apiVersion: v1
kind: Namespace
metadata:
  name: '<%= ctx.deployment.namespace %>'
<% } -%>
