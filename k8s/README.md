# k8s/

The cluster stack for this project. Applied by Argo CD, not by hand — the Application that points
here lives in the platform repository (`apps/<project>.yaml`), and `kubectl apply` from a laptop
writes around the loop that keeps this directory honest.

```
kustomization.yaml   the file list
api.yaml             Express service (Dockerfile.api)
web.yaml             the bundle and the Caddy that serves it (Dockerfile.web)
ingress.yaml         one host, two backends: /api → api, / → web
```

## Cutting a release

CI publishes `g<short-sha>` per commit to `git.rezolver-zero.com/developer/ts-scaffolding/{api,web}`
and nothing else. A release is therefore **two lines**: the `image:` tag in `api.yaml` and in
`web.yaml`. Argo CD notices the commit, syncs, and the rollout waits for the readiness probes
(`/health` on the API, `/` on the web) before it takes the old pod away.

Both images of one release come from the same commit, and the tags being equal is what makes that
auditable. Nothing moves a tag: a fix is a new commit and new tags.

## What has to be true for this to deploy

Four things outside this directory, each of which fails with a message that names something else.

| what | where | the failure if it is missing |
|---|---|---|
| Registry credentials for the node | `/etc/rancher/k3s/registries.yaml` on the node | `ImagePullBackOff` whose event log says `401 Unauthorized` about a registry everyone can reach |
| Argo CD's key on this repository | Settings → Deploy keys, read-only | the Application sits at `repository not found`, because a key grants access to one repository and no more |
| A site block for the host | `srv01/router/caddy/Caddyfile` on the gateway | TLS terminates and the browser gets the gateway's own answer — the app is fine inside the cluster and unreachable from outside |
| A DNS answer for the host | nothing: the Pi-hole wildcard covers `rezolver-zero.com` | — |

The Ingress carries no `tls:` and the manifests carry no pull secret; both decisions are explained
where they live rather than repeated here.

## Known gap

The web pod runs as root. Two things stand in the way and both are recorded where they bite: the
official Caddy binary carries the file capability `cap_net_bind_service`, so `no_new_privs` (set by
`allowPrivilegeEscalation: false`) makes its exec fail; and uid 101 needs `/data`, Caddy's storage,
to arrive writable. Neither is urgent while the container serves static files, and neither is
acceptable forever.
