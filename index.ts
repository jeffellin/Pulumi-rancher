import * as pulumi from "@pulumi/pulumi";
import * as tls from "@pulumi/tls";
import * as command from "@pulumi/command";
import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import {RancherCluster} from "./ranchercluster"
import {Command} from "@pulumi/command/local";
import * as rancher2 from "@pulumi/rancher2";

import { VirtualMachine } from "@muhlba91/pulumi-proxmoxve/vm";
import {VM} from "./vm";
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

const c : RancherCluster = new RancherCluster("backup-bucket",{},{})

const fkk = rancher2.getClusterOutput({
    name: "backup-bucket",
}).clusterRegistrationToken;

const bucketNameString: pulumi.Output<string> = fkk.nodeCommand.apply(id => {
    if (typeof id === 'string') return id;
    throw new Error(`Expected a string but got: ${id}`);
});

let webServers = [];
for (let i = 0; i < 1; i++) {
    webServers.push(
        new VM(`web-server-${i}`, {sshKey: sshKey, rancherCluster:  c.cluster}, {dependsOn:c})
    );

}

//export let foo: pulumi.Output<string> =  bucketNameString
//export let publicHostnames = webServers.map(s => s.vm.ipv4Addresses);


