import * as pulumi from "@pulumi/pulumi";
import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import {PrivateKey} from "@pulumi/tls";
import {ComponentResourceOptions, Lifted, OutputInstance, ProviderResource} from "@pulumi/pulumi";
import {Command} from "@pulumi/command/remote";
import {ClusterV2} from "@pulumi/rancher2";
import {RancherClusterArgs} from "./ranchercluster";

export interface VMArgs {sshKey: PrivateKey
    rancherCluster: ClusterV2,
}



export class VM extends pulumi.ComponentResource {
    //public cluster: rancher2.ClusterV2;
    private proxmoxProvider: ProviderResource | undefined;
    readonly vm: proxmox.vm.VirtualMachine;

    constructor(name: string, args: VMArgs, opts: pulumi.ComponentResourceOptions) {

        super("pkg:index:VM", name, {}, opts);

        this.proxmoxProvider = opts.provider
        this.vm = this.createVM(name,args.sshKey);


        const remoteExec = new Command(name+"-remote-exec", {
            connection: {
                host: this.vm.ipv4Addresses.apply(ipv4Address=> ipv4Address[1][0]),
                user: "ubuntu",
                privateKey: args.sshKey.privateKeyPem
            }, create: pulumi.interpolate`${args.rancherCluster.clusterRegistrationToken.nodeCommand} --etcd --controlplane`,
        });

    }


    private createVM(vmName: string,sshKey: PrivateKey): proxmox.vm.VirtualMachine {
        return new proxmox.vm.VirtualMachine(vmName, {
            name: "name",
            nodeName: "pve",
            agent: {
                enabled: true,
            },
            initialization: {
                ipConfigs: [{
                    ipv4: { address: "dhcp" }
                },{
                    ipv4: { address: "dhcp" }
                }],
                userAccount: {
                    username: "ubuntu",
                    keys: [sshKey.publicKeyOpenssh],
                },
            },
            cpu: {
                cores: 4,
            },
            memory: {
                dedicated: 8096,
            },
            disks: [{
                datastoreId: "local-lvm",
                fileId: "synology:iso/jammy-server-cloudimg-amd64-custom.img",
                interface: "virtio0",
                iothread: true,
                discard: "on",
                size: 80,
            }],
            networkDevices: [
                { vlanId: 111, bridge: "vmbr0" },
                { vlanId: 4, bridge: "vmbr0" }
            ],

        },{ provider: this.proxmoxProvider});
    }
}







