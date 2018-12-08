# Repository access
#
#   The following SSH key will be used to access the repository:
#
#   <%- publicKey %>
#
#   Please make sure the key has access to this repository:
#
#   <%- ctx.deployment.repository.url %>
<% if (ctx.deployment.repository.hasOwnProperty("github")) { -%>
#
#   For this repository, you can manage deploy keys here:
#   https://github.com/<%- ctx.deployment.repository.github.path %>/settings/keys
<% } else if (ctx.deployment.repository.hasOwnProperty("gitlab")) { -%>
#
#   For this repository, you can manage deploy keys here:
#   https://gitlab.com/<%- ctx.deployment.repository.gitlab.path %>/settings/repository
#   (under section "Deploy Keys")
<% } -%>
