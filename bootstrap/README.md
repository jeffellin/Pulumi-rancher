Bootstrap the new cluster with
```
kapp deploy -a bootstrap -f <( ytt -f rancher-cluster/bootstrap/config -f rancher-cluster/bootstrap/values)                
```