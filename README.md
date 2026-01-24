# PowerTrackr

[![Build and Test](https://github.com/pitzzahh/powertrackr/actions/workflows/ci.yml/badge.svg)](https://github.com/pitzzahh/powertrackr/actions/workflows/ci.yml)

PowerTrackr is an application for recording, organizing, and reconciling electricity usage and payments across an account and its sub-meters. It is focused on practical billing and expense allocation rather than energy generation or investment modeling.

### Primary use case

- Multi-tenant buildings: manage per-unit sub-meter readings and allocate payments derived from a single utility account.
- Personal owner with an additional rental unit: track the rental unit’s consumption, expenses, and payments when it is sub-metered on the main account.

### Key features

- Record periodic billing entries with total kWh and balances per billing cycle.
- Support multiple sub-meters per billing period so each unit’s usage can be tracked separately.
- Associate payments with billing and sub-meter records for clear reconciliation.
- Provide straightforward billing summaries and per-unit charge calculations to support tenant billing and bookkeeping.
- User account flows including verification and optional two-factor authentication.
- Input validation and tests to help ensure consistency and correctness.

### Typical scenarios

- A landlord who needs to bill tenants by actual usage measured at sub-meters and reconcile those amounts against the main utility bill.
- A homeowner who also rents a unit on the same service connection and wants to track and separate the rental unit’s expenses and payments.
- Property managers who require concise per-period accounting for multiple units without complex energy-generation features.

### Localization and billing assumptions

Powertrackr uses a simple per-kWh allocation model and does not include jurisdiction-specific tariff components (for example, tiered rates, taxes, fixed charges, or time-of-use pricing). If you plan to use the system in a different jurisdiction, review and adapt the billing calculations to match local rules.

### Non-goals

- Modeling energy generation (for example, solar production) or investment/return analytics. The system is designed for billing and expense allocation, not for generation forecasting or financial instruments.

### Safety & compliance

- This project focuses on software-based tracking and billing; confirm local utility rules (not legal advice).

### Contributing

Contributions are welcome.

### License

TBA
