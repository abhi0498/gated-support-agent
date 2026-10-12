# gated-support-agent

An autonomous support agent for a print-on-demand store whose replies and actions are released by a deterministic gate, not by the model's own judgement.

## Support

**Ticket**:
A customer's message as received: subject, body, and the email and order reference exactly as the customer wrote them, unverified.
_Avoid_: Request, case, conversation

**Ticket ref**:
The stable human-facing identifier of a seeded ticket (e.g. `T-017`), used to join a ticket to its label.
_Avoid_: Ticket number, external id

**Ticket status**:
Where a ticket stands, read off its latest run: new, awaiting review, escalated, resolved or rejected. It is never recorded separately.
_Avoid_: State, stage

**Order reference**:
Whatever the customer typed to identify an order; it may be wrong or missing, and only becomes an Order once a tool resolves it.
_Avoid_: Order id (for the unverified value)

## Store

**Customer**:
A person who places orders, identified by email.
_Avoid_: User, client, account

**Order**:
A paid purchase that moves through paid, printing, shipped and delivered.
_Avoid_: Purchase, job

**Order number**:
The order's human-facing identifier (e.g. `PD-10417`), the one customers quote and replies cite.
_Avoid_: Order id

**Proof**:
A preview of the customer's artwork that must be approved before printing.
_Avoid_: Mockup, preview

## Agent

**Run**:
One attempt by one model to handle one ticket; a ticket can have many runs.
_Avoid_: Execution, attempt, job

**Verdict**:
The model's structured proposal for a ticket: intent, confidence, proposed action, reply and cited facts. It binds nothing.
_Avoid_: Decision, answer

**Decision**:
The gate's binding outcome for a run (auto-send, draft or escalate) with the reasons it was reached.
_Avoid_: Verdict, result

**Draft**:
A reply produced by a run, awaiting or having received its fate: approved, rejected, auto-sent, or superseded by a newer run's draft for the same ticket.
_Avoid_: Response, message

**Staged change**:
A side effect a run has prepared but not applied; it is applied only when its run's draft is sent, and discarded if rejected. An address change is the staged change in this domain.
_Avoid_: Pending update

**Reprint proposal**:
A suggested reprint that only a human can approve; the agent never reprints.
_Avoid_: Reprint request

## Evaluation

**Label**:
The hand-checked ground truth for a seeded ticket: its intent, expected action and required facts. Labels exist only in the eval set, never where the agent can see them.
_Avoid_: Annotation, tag, expected output

**Intent**:
The single category a ticket is assigned, chosen as the most severe one present when a ticket mixes several.
_Avoid_: Category, topic, type
