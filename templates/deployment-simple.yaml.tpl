apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: autoapply
  namespace: '<%- ctx.deployment.namespace %>'
  labels:
    component: autoapply
spec:
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        component: autoapply
        app: autoapply
    spec:
      serviceAccountName: autoapply
      containers:
        - name: autoapply
          image: '<%- ctx.deployment.image %>'
          args: ['env:AUTOAPPLY_CONFIG']
<% if (ctx.secrets && Object.keys(ctx.secrets).length) { -%>
          envFrom:
<%   Object.values(ctx.secrets).forEach(secret => { -%>
            - secretRef:
                name: '<%- secret.kubernetesName %>'
<%   }); -%>
<% } -%>
          env:
            - name: AUTOAPPLY_CONFIG
              value: |
<% if (ctx.secrets.hasOwnProperty("ssh") || ctx.secrets.hasOwnProperty("knownHosts")) { -%>
                init:
                  commands:
<%   if (ctx.secrets.hasOwnProperty("ssh") || ctx.secrets.hasOwnProperty("knownHosts")) { -%>
                    - mkdir -p ~/.ssh && chmod 700 ~/.ssh
<%   } -%>
<%   if (ctx.secrets.hasOwnProperty("ssh")) { -%>
                    - echo "${<%- ctx.secrets.ssh.kubernetesEnvName %>}" > ~/.ssh/id_rsa && chmod 600 ~/.ssh/id_rsa
<%   } -%>
<%   if (ctx.secrets.hasOwnProperty("knownHosts")) { -%>
                    - echo "${<%- ctx.secrets.knownHosts.kubernetesEnvName %>}" > ~/.ssh/known_hosts
<%   } -%>
<% } -%>
                loop:
                  sleep: <%- ctx.deployment.sleep %>
                  commands:
                    - git clone <%- ctx.deployment.git.args %> <%- ctx.deployment.repository.url %> '.'
<% for (const command of ctx.deployment.build) { -%>
                    - <%- isNaN(command) ? command : `'${command}'` %>
<% } -%>
<% for (const path of ctx.deployment.path) { -%>
<%   if (ctx.secrets.hasOwnProperty("yamlCrypt")) { -%>
                    - yaml-crypt -k "env:<%- ctx.secrets.yamlCrypt.kubernetesEnvName %>" --dir --decrypt '<%- path %>'
<%   } -%>
<% } -%>
<% const paths = ctx.deployment.path.map(s => `-f '${s}'`).join(" "); -%>
<% if (ctx.deployment.prune) { -%>
                    - kubectl apply --prune -l 'component!=autoapply' <%- ctx.deployment.pruneWhitelist.map(s => `--prune-whitelist '${s}'`).join(" ") %> <%- paths %>
<% } else { -%>
                    - kubectl apply <%- paths %>
<% } -%>
<% if (ctx.deployment.tolerations) { -%>
      tolerations:
        - effect: NoExecute
          operator: Exists
<% } -%>
<% if (ctx.secrets.hasOwnProperty("dockercfg")) { -%>
      imagePullSecrets:
        - name: <%- ctx.secrets.dockercfg.kubernetesName %>
<% } -%>
