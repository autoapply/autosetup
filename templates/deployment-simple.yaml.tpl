apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: autoapply
  namespace: '<%= ctx.deployment.namespace %>'
spec:
  template:
    metadata:
      labels:
        app: autoapply
    spec:
      serviceAccountName: autoapply
      containers:
        - name: autoapply
          image: '<%= ctx.deployment.image %>'
          args: ['env:AUTOAPPLY_CONFIG']
<% if (ctx.secrets && Object.keys(ctx.secrets).length) { -%>
          envFrom:
<%   Object.values(ctx.secrets).forEach(secret => { -%>
            - secretRef:
                name: '<%= secret.kubernetesName %>'
<%   }); -%>
<% } -%>
          env:
            - name: AUTOAPPLY_CONFIG
              value: |
<% if (ctx.secrets.ssh || ctx.secrets.knownHosts || ctx.secrets.yamlCrypt) { -%>
                init:
                  commands:
<%   if (ctx.secrets.ssh || ctx.secrets.knownHosts) { -%>
                    - mkdir -p ~/.ssh && chmod 700 ~/.ssh
<%   } -%>
<%   if (ctx.secrets.ssh) { -%>
                    - echo "${<%= ctx.secrets.ssh.envName %>}" > ~/.ssh/id_rsa && chmod 600 ~/.ssh/id_rsa
<%   } -%>
<%   if (ctx.secrets.knownHosts) { -%>
                    - echo "${<%= ctx.secrets.knownHosts.envName %>}" > ~/.ssh/known_hosts
<%   } -%>
<%   if (ctx.secrets.yamlCrypt) { -%>
                    - mkdir -p ~/.yaml-crypt && chmod 700 ~/.yaml-crypt
                    - echo "${<%= ctx.secrets.yamlCrypt.envName %>}" > ~/.yaml-crypt/key && chmod 600 ~/.yaml-crypt/key
<%   } -%>
<% } -%>
                loop:
                  sleep: <%= ctx.deployment.sleep %>
                  commands:
                    - git clone <%= ctx.deployment.git.args %> <%= ctx.deployment.repository %>
<% if (ctx.secrets.yamlCrypt) { -%>
                    - yaml-crypt --key ~/.yaml-crypt/key --dir --rm --decrypt '<%= ctx.deployment.path %>'
<% } -%>
                    - kubectl apply -f '<%= ctx.deployment.path %>'
<% if (ctx.secrets.dockercfg) { -%>
      imagePullSecrets:
        - name: <%= ctx.secrets.dockercfg.kubernetesName %>
<% } -%>
