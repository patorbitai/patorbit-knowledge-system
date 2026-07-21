# Compliance

## Purpose

Regulatory compliance readiness for the Patorbit platform.

## Target Frameworks

| Framework | Scope                | Key Requirements                                    |
| --------- | -------------------- | --------------------------------------------------- |
| GDPR      | EU users             | Data subject rights, DPA, breach notification       |
| ISO 27001 | Global               | ISMS, risk management, security controls            |
| SOC 2     | Enterprise customers | Security, availability, confidentiality             |
| CCPA      | California users     | Right to know, right to delete, opt-out             |
| DPDP      | India                | Consent, data localization, data protection officer |

## Architecture Readiness

| Requirement         | Implementation                                               |
| ------------------- | ------------------------------------------------------------ |
| Data Mapping        | Documented data flows in data architecture                   |
| Retention           | Automated lifecycle policies                                 |
| Deletion            | Hard delete for personal data, soft delete for business data |
| Breach Notification | Automated incident response + notification workflow          |
| DPA                 | Standard DPA available for enterprise customers              |

## References

- [Privacy](privacy.md): Privacy controls.
- [Audit Logging](audit-logging.md): Audit trails.
