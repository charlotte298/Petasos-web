"""Amy landing page on Google Cloud.

Builds the repo's Dockerfile for linux/amd64, pushes it to Artifact Registry, runs it on
Cloud Run and puts it on a custom domain in the amyconnects.ai Cloud DNS zone.

Two ways to attach the domain (config `domainMode`):
  loadbalancer  Global external HTTPS load balancer with a Google-managed certificate and
                Cloud CDN. No domain-ownership verification needed. ~$18/month for the
                forwarding rules. Cloud Run only accepts traffic from the load balancer.
  mapping       Cloud Run domain mapping. No load balancer cost, but the account running
                `pulumi up` must be a verified owner of the domain in Search Console.
"""

import pulumi
import pulumi_docker_build as docker_build
import pulumi_gcp as gcp

config = pulumi.Config()
project = pulumi.Config("gcp").require("project")
region = pulumi.Config("gcp").get("region") or "us-central1"

domain = config.require("domain")
dns_zone = config.get("dnsZone") or "amyconnects"
domain_mode = config.get("domainMode") or "loadbalancer"
if domain_mode not in ("loadbalancer", "mapping"):
    raise ValueError(f"domainMode must be 'loadbalancer' or 'mapping', got {domain_mode!r}")
service_name = config.get("serviceName") or "amy-landing"
min_instances = config.get_int("minInstances") or 0
max_instances = config.get_int("maxInstances") or 3

# --- APIs -------------------------------------------------------------------------------

api_names = ["run.googleapis.com", "artifactregistry.googleapis.com", "dns.googleapis.com"]
if domain_mode == "loadbalancer":
    api_names.append("compute.googleapis.com")
apis = [
    gcp.projects.Service(
        f"api-{name.split('.')[0]}",
        service=name,
        disable_on_destroy=False,
    )
    for name in api_names
]

# --- Image ------------------------------------------------------------------------------

repo = gcp.artifactregistry.Repository(
    "images",
    repository_id=service_name,
    format="DOCKER",
    location=region,
    description="Amy landing page images",
    cleanup_policies=[
        gcp.artifactregistry.RepositoryCleanupPolicyArgs(
            id="keep-recent",
            action="KEEP",
            most_recent_versions=gcp.artifactregistry.RepositoryCleanupPolicyMostRecentVersionsArgs(
                keep_count=10,
            ),
        ),
    ],
    opts=pulumi.ResourceOptions(depends_on=apis),
)

registry = f"{region}-docker.pkg.dev"
image_name = pulumi.Output.concat(registry, "/", project, "/", repo.repository_id, "/", service_name)
access_token = gcp.organizations.get_client_config().access_token

image = docker_build.Image(
    "image",
    context=docker_build.BuildContextArgs(location=".."),
    dockerfile=docker_build.DockerfileArgs(location="../Dockerfile"),
    # Cloud Run runs amd64; this also works from Apple Silicon via buildx emulation.
    platforms=[docker_build.Platform.LINUX_AMD64],
    build_args={
        "VITE_BASE": "/",
        "VITE_SITE_URL": f"https://{domain}/",
        "VITE_POSTHOG_KEY": config.get("posthogKey") or "",
        "VITE_POSTHOG_HOST": config.get("posthogHost") or "https://us.i.posthog.com",
        "VITE_FORMS_ENDPOINT": config.get("formsEndpoint") or "",
    },
    push=True,
    tags=[image_name.apply(lambda n: f"{n}:latest")],
    registries=[
        docker_build.RegistryArgs(
            address=registry,
            username="oauth2accesstoken",
            password=pulumi.Output.secret(access_token),
        ),
    ],
)

# Deploy by digest so every build rolls out a new revision.
image_ref = pulumi.Output.concat(image_name, "@", image.digest)

# --- Cloud Run --------------------------------------------------------------------------

service = gcp.cloudrunv2.Service(
    "service",
    name=service_name,
    location=region,
    ingress=(
        "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
        if domain_mode == "loadbalancer"
        else "INGRESS_TRAFFIC_ALL"
    ),
    deletion_protection=False,
    template=gcp.cloudrunv2.ServiceTemplateArgs(
        scaling=gcp.cloudrunv2.ServiceTemplateScalingArgs(
            min_instance_count=min_instances,
            max_instance_count=max_instances,
        ),
        max_instance_request_concurrency=200,
        containers=[
            gcp.cloudrunv2.ServiceTemplateContainerArgs(
                image=image_ref,
                ports=gcp.cloudrunv2.ServiceTemplateContainerPortsArgs(container_port=8080),
                resources=gcp.cloudrunv2.ServiceTemplateContainerResourcesArgs(
                    limits={"cpu": "1", "memory": "256Mi"},
                    cpu_idle=True,
                    startup_cpu_boost=True,
                ),
                startup_probe=gcp.cloudrunv2.ServiceTemplateContainerStartupProbeArgs(
                    http_get=gcp.cloudrunv2.ServiceTemplateContainerStartupProbeHttpGetArgs(
                        path="/healthz",
                    ),
                    period_seconds=3,
                    failure_threshold=5,
                ),
            ),
        ],
    ),
    opts=pulumi.ResourceOptions(depends_on=apis),
)

# Public website: anyone may invoke. (Fails if an org policy restricts allUsers.)
gcp.cloudrunv2.ServiceIamMember(
    "public-invoker",
    name=service.name,
    location=region,
    role="roles/run.invoker",
    member="allUsers",
)

# --- Domain -----------------------------------------------------------------------------

if domain_mode == "loadbalancer":
    ip = gcp.compute.GlobalAddress("ip", name=f"{service_name}-ip", opts=pulumi.ResourceOptions(depends_on=apis))

    neg = gcp.compute.RegionNetworkEndpointGroup(
        "neg",
        name=f"{service_name}-neg",
        region=region,
        network_endpoint_type="SERVERLESS",
        cloud_run=gcp.compute.RegionNetworkEndpointGroupCloudRunArgs(service=service.name),
    )

    backend = gcp.compute.BackendService(
        "backend",
        name=f"{service_name}-backend",
        load_balancing_scheme="EXTERNAL_MANAGED",
        backends=[gcp.compute.BackendServiceBackendArgs(group=neg.id)],
        # Static site: let nginx's Cache-Control headers drive the CDN.
        enable_cdn=True,
        cdn_policy=gcp.compute.BackendServiceCdnPolicyArgs(
            cache_mode="USE_ORIGIN_HEADERS",
            negative_caching=False,
            cache_key_policy=gcp.compute.BackendServiceCdnPolicyCacheKeyPolicyArgs(
                include_host=True,
                include_protocol=True,
                include_query_string=True,
            ),
        ),
    )

    https_map = gcp.compute.URLMap("https-map", name=f"{service_name}-https", default_service=backend.id)

    cert = gcp.compute.ManagedSslCertificate(
        "cert",
        # Certificate names are immutable; include the domain so changing it creates a new one.
        name=f"{service_name}-{domain.replace('.', '-')}"[:63],
        managed=gcp.compute.ManagedSslCertificateManagedArgs(domains=[domain]),
        opts=pulumi.ResourceOptions(depends_on=apis),
    )

    https_proxy = gcp.compute.TargetHttpsProxy(
        "https-proxy",
        name=f"{service_name}-https",
        url_map=https_map.id,
        ssl_certificates=[cert.id],
    )

    gcp.compute.GlobalForwardingRule(
        "https",
        name=f"{service_name}-https",
        target=https_proxy.id,
        ip_address=ip.address,
        port_range="443",
        load_balancing_scheme="EXTERNAL_MANAGED",
        ip_protocol="TCP",
    )

    # Plain HTTP redirects to HTTPS.
    redirect_map = gcp.compute.URLMap(
        "http-redirect",
        name=f"{service_name}-http-redirect",
        default_url_redirect=gcp.compute.URLMapDefaultUrlRedirectArgs(
            https_redirect=True,
            strip_query=False,
            redirect_response_code="MOVED_PERMANENTLY_DEFAULT",
        ),
    )
    http_proxy = gcp.compute.TargetHttpProxy("http-proxy", name=f"{service_name}-http", url_map=redirect_map.id)
    gcp.compute.GlobalForwardingRule(
        "http",
        name=f"{service_name}-http",
        target=http_proxy.id,
        ip_address=ip.address,
        port_range="80",
        load_balancing_scheme="EXTERNAL_MANAGED",
        ip_protocol="TCP",
    )

    gcp.dns.RecordSet(
        "dns",
        managed_zone=dns_zone,
        name=f"{domain}.",
        type="A",
        ttl=300,
        rrdatas=[ip.address],
    )
    pulumi.export("loadBalancerIp", ip.address)
else:
    gcp.cloudrun.DomainMapping(
        "domain-mapping",
        name=domain,
        location=region,
        metadata=gcp.cloudrun.DomainMappingMetadataArgs(namespace=project),
        spec=gcp.cloudrun.DomainMappingSpecArgs(route_name=service.name),
    )
    gcp.dns.RecordSet(
        "dns",
        managed_zone=dns_zone,
        name=f"{domain}.",
        type="CNAME",
        ttl=300,
        rrdatas=["ghs.googlehosted.com."],
    )

pulumi.export("url", f"https://{domain}/")
pulumi.export("cloudRunUrl", service.uri)
pulumi.export("image", image_ref)
