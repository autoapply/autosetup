<% for (const namespace of ctx.allNamespaces) { -%>
<%   if (namespace !== "default") { -%>
apiVersion: v1
kind: Namespace
metadata:
  name: '<%- namespace %>'
---
<%   } -%>
<% } -%>
