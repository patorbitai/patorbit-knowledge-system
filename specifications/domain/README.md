# Domain Architecture

## Overview

This document set defines the complete domain architecture for the **Patorbit platform**, an AI-powered Career Intelligence Platform that transforms resumes into verifiable, evidence-backed Career Passports. The architecture is designed using strategic Domain-Driven Design (DDD), Event-Driven Architecture, and Clean Architecture principles.

The domain architecture establishes the universal language, bounded contexts, entities, value objects, aggregates, events, workflows, and trust infrastructure that govern the entire platform. It is the canonical reference for all engineering and product decisions.

## Goals

- **Establish a Ubiquitous Language** that every team, product manager, and engineer uses unambiguously across the organization.
- **Define clear Bounded Contexts** with explicit responsibilities, owned data, and inter-context communication contracts.
- **Model the domain with precision**, capturing entities, value objects, aggregates, and their invariants in a way that maps cleanly to implementation.
- **Design for trust**, embedding verification, evidence quality, confidence scoring, and reputation directly into the domain model.
- **Enable scale** through aggregate boundaries, event-driven integration, and persistence-agnostic repository definitions.
- **Future-proof the platform** by defining extensibility points for new AI services, enterprise integrations, and product innovations.

## Folder Structure

| File                     | Description                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `README.md`              | This file. Overview and navigation guide.                                                    |
| `ubiquitous-language.md` | Canonical vocabulary with definitions, business rules, and term relationships.               |
| `bounded-contexts.md`    | Bounded context map with responsibilities, events, and dependencies.                         |
| `domain-model.md`        | Complete domain model with entities, relationships, cardinality, and aggregate boundaries.   |
| `entities.md`            | Detailed specification of every major entity with attributes, lifecycle, and business rules. |
| `value-objects.md`       | Immutable value objects with validation, equality, and serialization rules.                  |
| `aggregates.md`          | Aggregate root definitions with children, invariants, and consistency boundaries.            |
| `repositories.md`        | Repository interfaces with query contracts and persistence independence.                     |
| `domain-services.md`     | Business logic services with responsibilities and interaction models.                        |
| `domain-events.md`       | Event catalog with producers, consumers, payloads, and flow diagrams.                        |
| `workflows.md`           | End-to-end business workflows with sequence diagrams.                                        |
| `permissions.md`         | Authorization model with roles, ownership, and access inheritance.                           |
| `knowledge-graph.md`     | Knowledge Graph design with node/edge types, traversal, versioning, and provenance.          |
| `trust-model.md`         | Trust Engine design with sources, scores, decay, and propagation rules.                      |
| `confidence-model.md`    | Confidence Engine design with factors, weighting, and composite scoring.                     |

## Navigation Guide

### For Product Managers

Start with the **Ubiquitous Language** to understand the vocabulary. Then read **Bounded Contexts** and **Workflows** to understand how the platform organizes capabilities and how users interact with it.

### For Engineers

Begin with **Domain Model** and **Aggregates** to understand the structural foundation. Then deep-dive into **Entities**, **Value Objects**, and **Repositories** for implementation guidance. Study **Domain Events** for event-driven integration patterns.

### For Architects

Read **Bounded Contexts**, **Domain Events**, and **Knowledge Graph** for strategic design. Review **Trust Model** and **Confidence Model** for the core differentiators. Cross-reference with **Workflows** for end-to-end consistency.

### For Data / AI Engineers

Focus on **Knowledge Graph**, **Trust Model**, **Confidence Model**, and **Domain Services** to understand the AI service layer and knowledge infrastructure.

## Relationship with Other Specifications

This domain architecture is part of the broader Patorbit Knowledge System (PKS). It relates to:

- **Application Architecture**: The application layer implements the domain logic defined here, translating domain commands into HTTP handlers, UI components, and background jobs.
- **Infrastructure Architecture**: Infrastructure concerns (databases, message buses, caches) are chosen to fulfill the repository contracts and event subscriptions defined here.
- **API Specifications**: Public and internal APIs expose bounded context capabilities as defined in this document set.
- **Data Architecture**: The persistence model derives directly from the aggregate boundaries and entity relationships specified here.

## Design Principles

1. **Domain-Centric Design**: All capabilities flow from the domain model. No technical concern overrides business logic.
2. **Explicit Boundaries**: Bounded contexts own their data and communicate exclusively through events. No shared databases across contexts.
3. **Immutability Where Possible**: Value objects are immutable. Events are append-only. Entity state changes produce events.
4. **Trust by Design**: Every claim requires evidence. Every evidence source has verification. Every verification has confidence. Trust is computed, not assigned.
5. **Knowledge as a Graph**: Career data is a network of connected nodes (people, claims, evidence, organizations), not flat records.
6. **Evolutionary Architecture**: The model supports gradual enrichment — claims can gain evidence, evidence can gain verification, confidence can increase over time.
7. **Auditability**: All state changes are recorded as events. The provenance of every knowledge node is traceable.

## Versioning

This domain architecture is versioned independently of the platform codebase. The current version is **1.0.0**. Changes to the architecture are tracked via Architecture Decision Records (ADRs) in the `adr/` directory.
