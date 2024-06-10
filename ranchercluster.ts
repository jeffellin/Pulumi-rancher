import * as rancher2 from "@pulumi/rancher2";
import * as pulumi from "@pulumi/pulumi";
import {Lifted, OutputInstance} from "@pulumi/pulumi";

export interface RancherClusterArgs {
}

export class RancherCluster extends pulumi.ComponentResource {
    public readonly cluster: rancher2.ClusterV2;
    public readonly joinCommand: pulumi.Output<string>;
    constructor(name: string, args: RancherClusterArgs, opts: pulumi.ComponentResourceOptions) {
        super("pkg:index:RancherCluster", name, {}, opts);
        this.cluster = new rancher2.ClusterV2("clusterV2Resource", {
            name: name,
            kubernetesVersion: "v1.28.9+rke2r1"
        },{parent:this});

        this.joinCommand = this.cluster.clusterRegistrationToken.command;
        this.registerOutputs({joinCommand: "non"})
    }
}