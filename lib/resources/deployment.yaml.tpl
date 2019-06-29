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
<% if (ctx.config.autoapply.init.length > 0) { -%>
                init:
                  commands:
<%   for (const command of ctx.config.autoapply.init) { -%>
<%     if (command === "$write-ssh-keys") { -%>
<%       if (ctx.secrets.hasOwnProperty("SSH") || ctx.secrets.hasOwnProperty("SSH_HOST_KEY")) { -%>
                    - mkdir -p -m 700 ~/.ssh
<%         if (ctx.secrets.hasOwnProperty("SSH")) { -%>
                    - echo "${SSH}" > ~/.ssh/id_rsa && chmod 600 ~/.ssh/id_rsa
<%         } -%>
<%         if (ctx.secrets.hasOwnProperty("SSH_HOST_KEY")) { -%>
                    - echo "${SSH_HOST_KEY}" > ~/.ssh/known_hosts
<%         } -%>
<%       } -%>
<%     } else if (command === "$import-gpg-keys") { -%>
<%       if (ctx.secrets.hasOwnProperty("GPG")) { -%>
                    - echo "${GPG}" | gpg --import
<%       } -%>
<%     } else { -%>
                    - <%- command %>
<%     } -%>
<%   } -%>
<% } -%>
                loop:
                  sleep: <%- ctx.config.autoapply.sleep %>
<% if (ctx.config.autoapply.commands.length > 0) { -%>
                  commands:
<%   for (const command of ctx.config.autoapply.commands) { -%>
<%     if (command === "$git-clone") { -%>
                    - git clone <%- ctx.config.git.args %> <%- ctx.config.git.url %> '.'
<%     } else if (command === "$yaml-crypt-decrypt") { -%>
<%       for (let index = 1; index <= ctx.config.secrets["yaml-crypt"].length; index++) { -%>
<%         for (const path of ctx.config.git.path) { -%>
                    - yaml-crypt -k "env:YAML_CRYPT_<%- index %>" --recursive --continue --decrypt '<%- path %>'
<%         } -%>
<%       } -%>
<%     } else if (command === "$sops-decrypt") { -%>
<%       if (Object.keys(ctx.config.secrets.sops).length > 0) { -%>
<%         for (const path of ctx.config.git.path) { -%>
                    - find '<%- path %>' -type f -regex '.*.ya*ml' -print0 | xargs -0 -n 1 -- sops --decrypt --in-place
<%         } -%>
<%       } -%>
<%     } else if (command === "$kubectl-apply") { -%>
<%       const paths = ctx.config.git.path.map(s => `${ctx.config.kubernetes.kustomize ? "-k" : "-f"} '${s}'`).join(" "); -%>
<%       if (ctx.config.kubernetes.prune) { -%>
                    - kubectl apply --prune -l 'component!=autoapply' <%- ctx.config.kubernetes['prune-whitelist'].map(s => `--prune-whitelist '${s}'`).join(" ") %> <%- paths %>
<%       } else { -%>
                    - kubectl apply <%- paths %>
<%       } -%>
<%     } else { -%>
                    - <%- command %>
<%     } -%>
<%   } -%>
<% } else { -%>
                  commands: []
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
