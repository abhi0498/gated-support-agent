CREATE TYPE "public"."draft_status" AS ENUM('pending', 'approved', 'rejected', 'auto_sent', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."gate_action" AS ENUM('auto_send', 'draft', 'escalate');--> statement-breakpoint
CREATE TYPE "public"."address_change_status" AS ENUM('staged', 'applied', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('paid', 'printing', 'shipped', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."proof_status" AS ENUM('pending', 'sent', 'approved', 'changes_requested');--> statement-breakpoint
CREATE TYPE "public"."reprint_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_usd" numeric(12, 6),
	"latency_ms" integer,
	"trace" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "agent_runs_id_ticketId_unique" UNIQUE("id","ticket_id")
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"intent" text NOT NULL,
	"confidence" double precision NOT NULL,
	"proposed_action" "gate_action" NOT NULL,
	"cited_facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action" "gate_action" NOT NULL,
	"reasons" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "decisions_runId_unique" UNIQUE("run_id"),
	CONSTRAINT "confidence_range" CHECK ("decisions"."confidence" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"body" text NOT NULL,
	"status" "draft_status" DEFAULT 'pending' NOT NULL,
	"reviewer_note" text,
	"flagged_at" timestamp with time zone,
	"flag_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drafts_runId_unique" UNIQUE("run_id"),
	CONSTRAINT "flag_only_auto_sent" CHECK ("drafts"."flagged_at" is null or "drafts"."status" = 'auto_sent')
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"auto_send_enabled" boolean DEFAULT true NOT NULL,
	"threshold" double precision DEFAULT 0.85 NOT NULL,
	"policy_limit_cents" integer DEFAULT 20000 NOT NULL,
	"disabled_reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "single_row" CHECK ("settings"."id"),
	CONSTRAINT "threshold_range" CHECK ("settings"."threshold" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"customer_email" text NOT NULL,
	"order_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "address_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"new_address" jsonb NOT NULL,
	"status" "address_change_status" DEFAULT 'staged' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'paid' NOT NULL,
	"total_cents" integer NOT NULL,
	"items" jsonb NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_number_unique" UNIQUE("number"),
	CONSTRAINT "total_non_negative" CHECK ("orders"."total_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "proof_status" DEFAULT 'pending' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proofs_orderId_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "reprint_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "reprint_status" DEFAULT 'pending' NOT NULL,
	"reviewer_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"carrier" text NOT NULL,
	"tracking_number" text NOT NULL,
	"eta" date NOT NULL,
	"shipped_at" timestamp with time zone NOT NULL,
	CONSTRAINT "shipments_orderId_unique" UNIQUE("order_id"),
	CONSTRAINT "shipments_trackingNumber_unique" UNIQUE("tracking_number")
);
--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_run_id_ticket_id_agent_runs_id_ticket_id_fk" FOREIGN KEY ("run_id","ticket_id") REFERENCES "public"."agent_runs"("id","ticket_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address_changes" ADD CONSTRAINT "address_changes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address_changes" ADD CONSTRAINT "address_changes_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reprint_proposals" ADD CONSTRAINT "reprint_proposals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reprint_proposals" ADD CONSTRAINT "reprint_proposals_run_id_agent_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_runs_ticket_id_index" ON "agent_runs" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "drafts_one_pending_per_ticket" ON "drafts" USING btree ("ticket_id") WHERE "drafts"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "address_changes_run_id_index" ON "address_changes" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "address_changes_order_id_index" ON "address_changes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_customer_id_index" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "reprint_proposals_run_id_index" ON "reprint_proposals" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "reprint_proposals_order_id_index" ON "reprint_proposals" USING btree ("order_id");