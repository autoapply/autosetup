# Git repository
#
#   After the objects have been created in Kubernetes, the autoapply
#   process will clone the git repository every <%= ctx.deployment.sleep %> seconds and will
#   apply the files it finds to the Kubernetes cluster.
#
#   Repository URL: <%= ctx.deployment.repository %>
<% if (ctx.deployment.path !== ".") { -%>
#   Path: <%= ctx.deployment.path %>
<% } -%>
