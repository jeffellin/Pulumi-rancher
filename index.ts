import * as pulumi from "@pulumi/pulumi";
import * as tls from "@pulumi/tls";
import * as command from "@pulumi/command";
import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import {RancherCluster} from "./ranchercluster"
import {Command} from "@pulumi/command/local";
import * as rancher2 from "@pulumi/rancher2";

import { VirtualMachine } from "@muhlba91/pulumi-proxmoxve/vm";
import {VM} from "./vm";

const cfg = new pulumi.Config();
const stack = pulumi.getStack();
import {Token} from "@pulumi/rancher2";
import {Output} from "@pulumi/pulumi";
// Generate an RSA private key
const sshKey = new tls.PrivateKey("generic-ssh-key", {
    algorithm: "RSA",
    rsaBits: 4096,
});

const saveKeys = new Command("save-keys", {
    create: pulumi.interpolate`mkdir -p .ssh-${pulumi.getStack()} && echo "${sshKey.privateKeyOpenssh}" > .ssh-${pulumi.getStack()}/id_rsa.key `,
    delete: `rm -rvf .ssh-${pulumi.getStack()}/`,
});

// Define Proxmox provider configuration
const proxmoxProvider = new proxmox.Provider("proxmox", {
    endpoint: "https://192.168.1.34:8006/",
    username: "root@pam",
    insecure: true,
    ssh: {
        agent: true,
    },
});

let clusterName = cfg.get("clustername") || "none"
const foo = rancher2.getClusterOutput({
    name: clusterName
});

const nodeCommand = foo.clusterRegistrationToken.nodeCommand
let nodeName = cfg.get("node") || "pve"

const saveKubeConfig = new Command("save-kube", {
    create: pulumi.interpolate`mkdir -p .kube-${pulumi.getStack()} && echo "${foo.kubeConfig}" > .kube-${pulumi.getStack()}/config `,
    delete: `rm -rvf .kube-${pulumi.getStack()}/`,
});
let coontrolPlaneCount = cfg.getNumber("controlplanes") || 1;
let controlPlane = [];
for (let i = 0; i < coontrolPlaneCount; i++) {
    controlPlane.push(
        new VM(`${stack}-control-plane-${i}`, {node:nodeName,sshKey: sshKey, joinCommand:  nodeCommand,commandOptions: " --etcd --controlplane"}, {})
    );

}
let workerNodesCount = cfg.getNumber("workers") || 1;
let workerNodes = [];
for (let i = 0; i < workerNodesCount; i++) {
    workerNodes.push(
        new VM(`${stack}-worker-${i}`, {node:nodeName, sshKey: sshKey, joinCommand:  nodeCommand,commandOptions: " --worker"}, {})
    );

}
//export let foo: pulumi.Output<string> =  bucketNameString
//export let publicHostnames = webServers.map(s => s.vm.ipv4Addresses);
export  let fra =nodeCommand

