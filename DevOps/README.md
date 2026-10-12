# Kind Cluster with Cilium CNI

This project provisions a local Kubernetes cluster using `kind` and deploys the `Cilium` CNI using Terraform. It disables the default `kindnet` CNI so Cilium can manage all cluster networking.

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running!)
- [Terraform](https://developer.hashicorp.com/terraform/downloads)

## Usage

1. **Start Docker Desktop** if it isn't running already.
2. Initialize Terraform:
   ```bash
   terraform init
   ```
3. Apply the configuration:
   ```bash
   terraform apply
   ```
   *(Wait for the cluster to start and Cilium to deploy. This might take a few minutes as images are pulled.)*

## Accessing the Cluster

Terraform writes the cluster's kubeconfig to a local file (e.g., `./kind-cilium-config`) instead of modifying your `~/.kube/config`.

To use `kubectl` with this cluster in PowerShell, run the hint provided in the Terraform output:
```powershell
$env:KUBECONFIG="$PWD\kind-cilium-config"
```
*(On bash/zsh, use `export KUBECONFIG="$PWD/kind-cilium-config"`)*

### Verifying the setup
```bash
# Check that all 3 nodes are Ready (this means Cilium is working)
kubectl get nodes

# Check that the Cilium DaemonSet is ready
kubectl -n kube-system get ds cilium

# Check that Hubble Relay and UI are running
kubectl -n kube-system get deploy hubble-relay hubble-ui
```

### Hubble UI
The Hubble UI is exposed via a NodePort and mapped to your host. By default, you can access it at:
[http://localhost:31000](http://localhost:31000)

## Cleanup
To destroy the cluster and all associated resources:
```bash
terraform destroy
```
