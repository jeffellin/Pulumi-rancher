import * as rancher2 from "@pulumi/rancher2";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export interface KubeBootArgs {
}

export class KubeBootstrap extends pulumi.ComponentResource {
    constructor(name: string, args: KubeBootArgs, opts: pulumi.ComponentResourceOptions) {
        super("pkg:index:KubeBootstrap", name, {}, opts);
        this.registerOutputs({joinCommand: "non"})


        const example = new k8s.yaml.ConfigFile("example", {
            file: "foo.yaml",
        });
    }
}