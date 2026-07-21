# Value Objects

## Purpose

This document defines the value objects for the Patorbit domain. Value objects are immutable objects without a distinct identity, defined by their attributes. They represent descriptive aspects of the domain and are compared based on their values, not their identity.

## Scope

This document covers all major value objects used across the Patorbit platform. For each value object, we define its purpose, attributes, validation rules, equality rules, and serialization considerations.

## Design Principles

- **Immutability**: All value objects are immutable. Any modification must result in a new instance.
- **Self-validation**: Value objects enforce their own invariants upon creation. Invalid state is not representable.
- **Value-based Equality**: Two value objects are equal if their constituent values are equal.
- **Expressiveness**: They represent a concept from the ubiquitous language, making the domain model more expressive.

---

## 1. Email

**Purpose**: Represents a valid email address.

**Attributes**:

| Attribute | Type   | Description                                       |
| --------- | ------ | ------------------------------------------------- |
| `value`   | string | The full email address (e.g., "user@example.com") |

**Validation Rules**:

- Must be a non-empty string.
- Must match a standard email format regular expression (RFC 5322).
- The domain part must have a valid DNS record (optional, for stricter validation).
- Constructor throws an exception if validation fails.

**Equality Rules**:

- Two `Email` objects are equal if their `value` strings are identical, after case-insensitively normalizing the domain part. The local part is case-sensitive.
  - `user@EXAMPLE.com` == `user@example.com`
  - `User@example.com` != `user@example.com`

**Serialization**:

- Serializes to its raw string value.

---

## 2. PhoneNumber

**Purpose**: Represents a valid international phone number.

**Attributes**:

| Attribute        | Type   | Description                             |
| ---------------- | ------ | --------------------------------------- |
| `countryCode`    | string | International dialing code (e.g., "+1") |
| `nationalNumber` | string | The number within the country           |

**Validation Rules**:

- Must conform to E.164 format.
- Constructor parses a string input (e.g., "+14155552671") and populates attributes.
- Throws an exception for invalid formats.

**Equality Rules**:

- Two `PhoneNumber` objects are equal if their E.164 representations are identical.

**Serialization**:

- Serializes to its E.164 string representation.

---

## 3. Money

**Purpose**: Represents a monetary value with a specific currency.

**Attributes**:

| Attribute  | Type                    | Description                     |
| ---------- | ----------------------- | ------------------------------- |
| `amount`   | decimal                 | The monetary amount             |
| `currency` | Currency (value object) | The currency code (e.g., "USD") |

**Validation Rules**:

- Amount must not be negative in most contexts (e.g., subscription price).
- Currency must be a valid ISO 4217 code.

**Equality Rules**:

- Two `Money` objects are equal if both `amount` and `currency` are identical.
- Note: `10 USD` is not equal to `10 EUR`. Currency conversion is a domain service responsibility, not an equality concern.

**Serialization**:

- Serializes to an object: `{ "amount": "10.00", "currency": "USD" }`.

---

## 4. Currency

**Purpose**: Represents a valid ISO 4217 currency.

**Attributes**:

| Attribute | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| `code`    | string | 3-letter currency code (e.g., "USD") |

**Validation Rules**:

- Must be a valid ISO 4217 code.
- Can be implemented as an enum for type safety.

**Equality Rules**:

- Two `Currency` objects are equal if their `code` strings are identical.

**Serialization**:

- Serializes to its string code.

---

## 5. DateRange

**Purpose**: Represents a period of time with a start and an optional end date.

**Attributes**:

| Attribute | Type            | Description                                    |
| --------- | --------------- | ---------------------------------------------- |
| `start`   | Date            | The start date of the range                    |
| `end`     | Date (optional) | The end date of the range. Null means ongoing. |

**Validation Rules**:

- `start` date must not be null.
- If `end` date is present, it must be on or after the `start` date.

**Equality Rules**:

- Two `DateRange` objects are equal if their `start` and `end` dates are identical.

**Serialization**:

- Serializes to an object: `{ "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" | null }`.

---

## 6. Duration

**Purpose**: Represents a length of time, independent of any specific date.

**Attributes**:

| Attribute | Type | Description      |
| --------- | ---- | ---------------- |
| `years`   | int  | Number of years  |
| `months`  | int  | Number of months |
| `days`    | int  | Number of days   |

**Validation Rules**:

- All attributes must be non-negative.
- At least one attribute must be greater than zero.

**Equality Rules**:

- Two `Duration` objects are equal if their `years`, `months`, and `days` are all identical.

**Serialization**:

- Serializes to an object: `{ "years": 2, "months": 6, "days": 0 }`.

---

## 7. TrustScore

**Purpose**: Represents the computed reliability of a Claim, Evidence, Verifier, or Organization.

**Attributes**:

| Attribute | Type  | Description             |
| --------- | ----- | ----------------------- |
| `value`   | float | A score from 0.0 to 1.0 |

**Validation Rules**:

- Must be between 0.0 and 1.0, inclusive.

**Equality Rules**:

- Two `TrustScore` objects are equal if their `value` attributes are identical.

**Serialization**:

- Serializes to its float value.

---

## 8. ConfidenceScore

**Purpose**: Represents the computed certainty that a Claim is accurate.

**Attributes**:

| Attribute | Type  | Description             |
| --------- | ----- | ----------------------- |
| `value`   | float | A score from 0.0 to 1.0 |

**Validation Rules**:

- Must be between 0.0 and 1.0, inclusive.

**Equality Rules**:

- Two `ConfidenceScore` objects are equal if their `value` attributes are identical.

**Serialization**:

- Serializes to its float value.

---

## 9. VersionNumber

**Purpose**: Represents a semantic version number.

**Attributes**:

| Attribute | Type | Description   |
| --------- | ---- | ------------- |
| `major`   | int  | Major version |
| `minor`   | int  | Minor version |
| `patch`   | int  | Patch version |

**Validation Rules**:

- All parts must be non-negative integers.
- Follows Semantic Versioning 2.0.0 rules.

**Equality Rules**:

- Two `VersionNumber` objects are equal if all three parts are identical. Comparison methods (`isGreaterThan`, `isLessThan`) are also implemented.

**Serialization**:

- Serializes to a string "major.minor.patch" (e.g., "1.2.0").

---

## 10. Language

**Purpose**: Represents a language using ISO 639-1 code.

**Attributes**:

| Attribute | Type   | Description                         |
| --------- | ------ | ----------------------------------- |
| `code`    | string | 2-letter language code (e.g., "en") |

**Validation Rules**:

- Must be a valid ISO 639-1 code.
- Can be implemented as an enum for type safety.

**Equality Rules**:

- Two `Language` objects are equal if their `code` strings are identical.

**Serialization**:

- Serializes to its string code.

---

## 11. Address

**Purpose**: Represents a physical postal address.

**Attributes**:

| Attribute     | Type              | Description               |
| ------------- | ----------------- | ------------------------- |
| `streetLine1` | string            | Street address, line 1    |
| `streetLine2` | string (optional) | Street address, line 2    |
| `city`        | string            | City or locality          |
| `state`       | string (optional) | State or province         |
| `postalCode`  | string            | Postal code               |
| `country`     | string            | 2-letter ISO country code |

**Validation Rules**:

- `streetLine1`, `city`, `postalCode`, and `country` are required.
- `country` must be a valid ISO 3166-1 alpha-2 code.
- `postalCode` format is validated based on the `country`.

**Equality Rules**:

- Two `Address` objects are equal if all their corresponding attributes are identical.

**Serialization**:

- Serializes to a JSON object with all its attributes.

## References

- [Entities](entities.md): Where these value objects are used.
- [Ubiquitous Language](ubiquitous-language.md): Business definitions for these concepts.
