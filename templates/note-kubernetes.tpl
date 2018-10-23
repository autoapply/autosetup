# Deploy to Kubernetes
#
<% if (ctx.output === "-") { -%>
#   To apply this model to your Kubernetes cluster, either pipe this
#   output to "kubectl apply -f -" or specify an output file
<% } else { -%>
#   To apply this model to your Kubernetes cluster, run
#
#     kubectl apply -f <%= ctx.output %>
#
#   If you want to remove the objects from your cluster, run
#
#     kubectl delete -f <%= ctx.output %>
<%   if (ctx.deployment.namespace !== "default") { -%>
#
#   All objects will be created in the "<%= ctx.deployment.namespace %>" namespace,
#   so to list all existing objects, run
#
#     kubectl get all -n <%= ctx.deployment.namespace %>
<%   } -%>
<% } -%>
