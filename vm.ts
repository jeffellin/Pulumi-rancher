import * as pulumi from "@pulumi/pulumi";
import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import {PrivateKey} from "@pulumi/tls";
import {Input, ProviderResource} from "@pulumi/pulumi";
import {ClusterV2} from "@pulumi/rancher2";
import {Command} from "@pulumi/command/remote";

export interface VMArgs {sshKey: PrivateKey
    joinCommand: Input<string>,
    node: Input<string>,
    commandOptions: string
}




export class VM extends pulumi.ComponentResource {
    //public cluster: rancher2.ClusterV2;
    private proxmoxProvider: ProviderResource | undefined;
    readonly vm: proxmox.vm.VirtualMachine;

    constructor(name: string, args: VMArgs, opts: pulumi.ComponentResourceOptions) {

        super("pkg:index:VM", name, {}, opts);

        this.proxmoxProvider = opts.provider
        this.vm = this.createVM(args.node.toString(),name,args.sshKey);

        const remoteExec = new Command(name+"-remote-exec", {
            connection: {
                host: this.vm.ipv4Addresses.apply(ipv4Address=> ipv4Address[1][0]),
                user: "ubuntu",
                privateKey: args.sshKey.privateKeyPem
            },create: pulumi.interpolate`${args.joinCommand} ${args.commandOptions}`,
        },{parent:this});

    }


    private createVM(node: string,vmName: string,sshKey: PrivateKey): proxmox.vm.VirtualMachine {
        return new proxmox.vm.VirtualMachine(vmName, {
            name: vmName,
            nodeName: node,
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
                {  bridge: "vmbr0" },
                { vlanId: 4, bridge: "vmbr0" }
            ],

        },{ ignoreChanges: ["initialization.userAccount","disks","cdrom"],parent:this,provider: this.proxmoxProvider});
    }
}







