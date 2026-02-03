# PowerTrackr

<p style="white-space:nowrap; overflow-x:auto;"><a href="https://github.com/pitzzahh/powertrackr/actions/workflows/ci.yml"><img src="https://github.com/pitzzahh/powertrackr/actions/workflows/ci.yml/badge.svg" alt="Build and Test"></a>&nbsp;&nbsp;<a href="https://opensource.org/licenses/BSD-3-Clause"><img src="https://img.shields.io/badge/License-BSD%203--Clause-blue.svg" alt="License"></a>&nbsp;&nbsp;<a href="https://svelte.dev"><img src="https://img.shields.io/badge/Svelte-v5-red?style=flat-square&logo=svelte" alt="Svelte" /></a></p>

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

Contributions are welcome. If you'd like to help, please open an issue or a pull request. A few guidelines to make the review process smoother:

- Run the full test suite and ensure tests pass: `npm test` (see "Development" for environment requirements).
- Add tests for new features and bug fixes.
- Run the formatter and linter before submitting: `npm run format` and `npm run lint`.

### Development

Development setup

Prerequisites:

- Node.js 20.x or later
- PostgreSQL (local or via Docker)
- Optional: Docker for running PostgreSQL containers

Environment variables

Copy `.env.example` to `.env` and update the values for your environment (do not commit `.env`). At minimum, make sure `DATABASE_URL` and `ENCRYPTION_KEY` are set. See `.env.example` for a full sample.

Local Postgres (Docker example)

- Start Postgres in Docker:
  `docker run --rm --name powertrackr-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=powertrackr -p 5432:5432 -d postgres:15`
- Set `DATABASE_URL` as shown above.

Install and run

- Install dependencies: `npm ci`
- Apply database migrations: `npm run db:push` (requires `DATABASE_URL`)
- Start development server: `npm run dev` and open `http://localhost:5173`
- Build and preview a production-like build: `npm run build` && `npm run preview`

Database migrations

- Migrations are managed with Drizzle; the `drizzle/` directory contains migrations and snapshots.
- Create a migration with `npm run db:generate` and apply it with `npm run db:push`.

Testing

- Run tests: `npm test` (use `npm run test:ui` for the Vitest UI)
- Note: several tests require a running Postgres instance and will throw if `DATABASE_URL` is not set (unless running in CI). To run the full test suite locally, point `DATABASE_URL` to a test Postgres instance.

Formatting, linting and type checking

- Format with Prettier: `npm run format`
- Lint with oxlint: `npm run lint`
- Type checking and Svelte diagnostics: `npm run check`

### License

This project is licensed under the BSD 3-Clause License. See the `LICENSE` file for the full text.
