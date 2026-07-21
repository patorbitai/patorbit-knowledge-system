# Networking

## Purpose

Cloud networking architecture.

## Network Design

- **VPC**: Single VPC per environment, per region.
- **Subnets**: Public (load balancers), private (apps), protected (data).
- **NAT Gateway**: Outbound internet for private subnets.
- **Ingress**: Load balancer -> API Gateway -> Service.
- **Egress**: NAT Gateway, VPC Endpoints for private traffic.
- **Firewalls**: Kubernetes network policies, security groups.

## Service Discovery

- **Internal**: Kubernetes DNS (`service.namespace.svc.cluster.local`).
- **External**: Cloud provider DNS.

## References

- [Infrastructure Overview](infrastructure-overview.md): Network context.
- [Security Architecture](../security/security-architecture.md): Network security.
