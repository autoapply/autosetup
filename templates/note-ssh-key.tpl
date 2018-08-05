# Repository access
#
#   The following SSH key will be used to access the repository:
#
#   <%= publicKey %>
#
#   Please make sure the key has access to this repository:
#
#   <%= ctx.deployment.repository %>
<% if (ctx.deployment.github) { -%>
#
#   For this repository, you can manage deploy keys here:
#   https://github.com/<%= ctx.deployment.github.path %>/settings/keys
<% } else if (ctx.deployment.gitlab) { -%>
#
#   For this repository, you can manage deploy keys here:
#   https://gitlab.com/<%= ctx.deployment.gitlab.path %>/settings/repository
#   (under section "Deploy Keys")
<% } -%>
