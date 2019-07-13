apiVersion: apps/v1
kind: Deployment
metadata:
  name: autoapply
  namespace: '<%- ctx.config.kubernetes.namespace %>'
  labels:
    component: autoapply
spec:
  strategy:
    type: Recreate
  selector:
    matchLabels:
      component: autoapply
      app: autoapply
  template:
    metadata:
      labels:
        component: autoapply
        app: autoapply
    spec:
      serviceAccountName: autoapply
      containers:
        - name: autoapply
          image: '<%- ctx.config.autoapply.image %>'
          args: ['env:AUTOAPPLY_CONFIG']
<% if (Object.keys(ctx.secrets).length > 0) { -%>
          envFrom:
            - secretRef:
                name: autoapply-secret
<% } -%>
          env:
            - name: AUTOAPPLY_CONFIG
              value: |
<% if (ctx.autoapply.config) { -%>
<%-  ctx.autoapply.config.replace(/^/gm, " ".repeat(16)) %>
<% } else { -%>
<%   if (ctx.autoapply.init.length > 0) { -%>
                init:
                  commands:
<%     for (const command of ctx.autoapply.init) { -%>
                    - <%- command %>
<%     } -%>
<%   } -%>
                loop:
                  sleep: <%- ctx.config.autoapply.sleep %>
<%   if (ctx.autoapply.commands.length > 0) { -%>
                  commands:
<%     for (const command of ctx.autoapply.commands) { -%>
                    - <%- command %>
<%     } -%>
<%   } else { -%>
                  commands: []
<%   } -%>
<% } -%>
<% if (ctx.config.kubernetes.tolerations) { -%>
      tolerations:
        - effect: NoExecute
          operator: Exists
<% } -%>
<% if (ctx.dockercfg) { -%>
      imagePullSecrets:
        - name: autoapply-dockercfg
<% } -%>
