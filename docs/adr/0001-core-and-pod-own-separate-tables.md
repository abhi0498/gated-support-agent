# Core owns agent tables, pod owns domain tables

The database is shared, but table ownership follows the package boundary: `core` owns the tables every domain needs (tickets, runs, decisions, drafts, settings) and `pod` owns the print-on-demand tables (customers, orders, shipments, proofs, address changes, reprint proposals). Foreign keys may point from pod to core, never from core to pod, so a ticket stores the customer's email and order reference as plain text rather than referencing pod rows. This keeps the claim "a new domain is a new policy, not a core change" true for the schema as well as the code. There is still one migration history, generated from both schema files, because two histories against one database would race.

## Considered Options

- **Whole schema in pod**: simplest, but core's scorecard and kill switch would have to import pod to read drafts and settings, inverting the dependency.
- **A separate db package**: neutral, but it hides the boundary instead of enforcing it.
