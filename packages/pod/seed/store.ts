// The store the seeded tickets refer to. Dates are fixed so eval facts never move.
import type { Address, OrderItem, orderStatus, proofStatus } from "../src/db/schema.js";

/** "Today" for seeded data and eval runs (a Monday). */
export const SEED_TODAY = "2026-10-12";

/** Matches settings.policy_limit_cents; orders above it always escalate. */
export const SEED_POLICY_LIMIT_CENTS = 20000;

export interface SeedOrder {
  number: string;
  customer: { email: string; name: string };
  status: (typeof orderStatus.enumValues)[number];
  totalCents: number;
  items: OrderItem[];
  shippingAddress: Address;
  placedAt: string;
}

export interface SeedShipment {
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  eta: string;
  shippedAt: string;
}

export interface SeedProof {
  orderNumber: string;
  status: (typeof proofStatus.enumValues)[number];
  updatedAt: string;
}

const orderNumber = (n: number) => `PD-${String(n)}`;

function us(line1: string, city: string, region: string, postalCode: string): Address {
  return { line1, city, region, postalCode, country: "US" };
}

function order(
  n: number,
  name: string,
  status: SeedOrder["status"],
  totalCents: number,
  items: OrderItem[],
  shippingAddress: Address,
  placedOn: string,
): SeedOrder {
  const email = `${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z ]/g, "")
    .replace(/ /g, ".")}@example.test`;
  return {
    number: orderNumber(n),
    customer: { email, name },
    status,
    totalCents,
    items,
    shippingAddress,
    placedAt: `${placedOn}T10:00:00Z`,
  };
}

const stickers = (qty: number): OrderItem[] => [{ title: "Die-cut vinyl sticker 3in", qty }];
const poster = (qty: number): OrderItem[] => [{ title: "A2 art poster", qty }];
const tee = (qty: number): OrderItem[] => [{ title: "Unisex cotton tee", qty }];

// prettier-ignore
export const SEED_ORDERS: SeedOrder[] = [
  order(10401, "Maya Chen", "shipped", 2400, stickers(20), us("418 Larkspur Ave", "Portland", "OR", "97211"), "2026-09-28"),
  order(10402, "Omar Haddad", "shipped", 3800, poster(1), us("77 Birch Rd", "Austin", "TX", "78704"), "2026-09-29"),
  order(10403, "Priya Natarajan", "shipped", 5600, tee(2), us("1500 Granite St", "Denver", "CO", "80205"), "2026-09-30"),
  order(10404, "Lukas Becker", "delivered", 1800, stickers(50), us("9 Harbor Ln", "Boston", "MA", "02127"), "2026-09-20"),
  order(10405, "Aisha Bello", "shipped", 2900, poster(2), us("230 Pine St", "Seattle", "WA", "98101"), "2026-10-01"),
  order(10406, "Daniel Okafor", "shipped", 4200, [...tee(1), ...stickers(10)], us("61 Willow Ct", "Chicago", "IL", "60614"), "2026-09-30"),
  order(10407, "Sofia Rossi", "printing", 6400, tee(3), us("12 Ocean Dr", "San Diego", "CA", "92109"), "2026-10-06"),
  order(10408, "Kenji Watanabe", "shipped", 34000, stickers(2000), us("400 Market St", "Philadelphia", "PA", "19106"), "2026-09-27"),
  order(10409, "Grace Mensah", "printing", 125000, tee(50), us("88 Stadium Way", "Columbus", "OH", "43215"), "2026-10-03"),
  order(10410, "Ethan Brooks", "shipped", 2200, stickers(15), us("5 Cedar Ave", "Madison", "WI", "53703"), "2026-09-30"),
  order(10411, "Lucía Fernández", "shipped", 3100, poster(1), us("2200 Mission St", "San Francisco", "CA", "94110"), "2026-09-29"),
  order(10412, "Hannah Schultz", "shipped", 1500, stickers(10), us("34 Maple St", "Burlington", "VT", "05401"), "2026-09-18"),
  order(10413, "Noah Kim", "paid", 2600, stickers(25), us("19 Spruce Ln", "Raleigh", "NC", "27601"), "2026-10-08"),
  order(10414, "Chloe Martin", "printing", 4800, poster(2), us("300 Elm St", "Nashville", "TN", "37203"), "2026-10-02"),
  order(10415, "Ravi Patel", "paid", 3300, tee(1), us("710 Oak Ave", "Phoenix", "AZ", "85004"), "2026-10-10"),
  order(10416, "Emma Lindqvist", "paid", 2700, poster(1), us("45 King St", "Minneapolis", "MN", "55401"), "2026-10-05"),
  order(10417, "Jamal Wright", "paid", 3900, tee(2), us("98 River Rd", "Atlanta", "GA", "30303"), "2026-10-07"),
  order(10418, "Olivia Novak", "printing", 5200, poster(3), us("23 Hill St", "Pittsburgh", "PA", "15213"), "2026-10-04"),
  order(10419, "Mateo Silva", "paid", 1600, stickers(12), us("501 Bay St", "Tampa", "FL", "33602"), "2026-10-09"),
  order(10420, "Ingrid Holm", "paid", 2800, poster(1), us("14 Lake St", "Duluth", "MN", "55802"), "2026-10-08"),
  order(10421, "Ben Carter", "paid", 2100, stickers(18), us("66 Ash St", "Richmond", "VA", "23219"), "2026-10-10"),
  order(10422, "Zoe Adams", "paid", 3500, tee(1), us("8 Park Pl", "Brooklyn", "NY", "11217"), "2026-10-11"),
  order(10423, "Leo Fischer", "paid", 1900, stickers(15), us("90 Main St", "Boise", "ID", "83702"), "2026-10-10"),
  order(10424, "Amelia Clarke", "paid", 4400, poster(2), { line1: "22 Queen St", city: "Leeds", region: "West Yorkshire", postalCode: "LS1 2TW", country: "GB" }, "2026-10-09"),
  order(10425, "Samuel Ortiz", "paid", 2500, tee(1), us("300 Congress Ave", "Austin", "TX", "78701"), "2026-10-11"),
  order(10426, "Mia Johansson", "printing", 3000, poster(1), us("17 Spring St", "Providence", "RI", "02903"), "2026-10-04"),
  order(10427, "Lucas Moreau", "shipped", 2300, stickers(20), us("2 Bridge St", "Hartford", "CT", "06103"), "2026-09-30"),
  order(10428, "Ella Nguyen", "paid", 2600, tee(1), us("900 J St", "Sacramento", "CA", "95814"), "2026-10-11"),
  order(10429, "Henry Walsh", "paid", 3700, poster(2), us("15 Court St", "Albany", "NY", "12207"), "2026-10-10"),
  order(10430, "Isla Murphy", "delivered", 2800, poster(1), us("60 Church St", "Charleston", "SC", "29401"), "2026-09-22"),
  order(10431, "Jack Thompson", "delivered", 3200, tee(2), us("11 Mill Rd", "Louisville", "KY", "40202"), "2026-09-15"),
  order(10432, "Ava Rodriguez", "delivered", 1400, stickers(10), us("40 Palm Ave", "Miami", "FL", "33139"), "2026-09-24"),
  order(10433, "William Grant", "delivered", 2500, poster(1), us("7 Union Sq", "Salt Lake City", "UT", "84101"), "2026-09-23"),
  order(10434, "Nora Ali", "delivered", 2600, poster(1), us("3 Rose St", "Kansas City", "MO", "64106"), "2026-09-25"),
  order(10435, "Felix Wagner", "delivered", 56000, [{ title: "A1 event poster", qty: 40 }], us("500 Convention Blvd", "Las Vegas", "NV", "89109"), "2026-09-19"),
  order(10436, "Lily Evans", "delivered", 1700, stickers(12), us("25 Garden St", "Savannah", "GA", "31401"), "2026-09-26"),
  order(10437, "Oscar Petrov", "delivered", 3600, tee(2), us("140 Front St", "Memphis", "TN", "38103"), "2026-09-21"),
  order(10438, "Ruby Hughes", "delivered", 4100, poster(2), us("9 Vine St", "Cincinnati", "OH", "45202"), "2026-09-24"),
  order(10439, "Theo Laurent", "shipped", 2900, tee(1), us("18 Lake Ave", "Cleveland", "OH", "44113"), "2026-09-29"),
  order(10440, "Freya Olsen", "delivered", 3400, tee(2), us("220 Bay Rd", "Portland", "ME", "04101"), "2026-09-22"),
  order(10441, "Caleb Turner", "paid", 2000, stickers(16), us("75 Pine Rd", "Omaha", "NE", "68102"), "2026-10-11"),
  order(10442, "Camille Dubois", "delivered", 3000, poster(1), { line1: "400 Rue Saint-Paul", city: "Montréal", region: "QC", postalCode: "H2Y 1H4", country: "CA" }, "2026-09-20"),
  order(10443, "Marcus Reid", "shipped", 4600, tee(3), us("33 Commerce St", "Dallas", "TX", "75202"), "2026-09-26"),
  order(10444, "Harper Lewis", "delivered", 2700, poster(1), us("12 Oak St", "Asheville", "NC", "28801"), "2026-09-21"),
  order(10445, "Victor Ivanov", "shipped", 3300, tee(1), us("600 Broad St", "Newark", "NJ", "07102"), "2026-09-27"),
  order(10446, "Stella Park", "shipped", 2400, stickers(20), us("81 Hill Rd", "Ann Arbor", "MI", "48104"), "2026-09-24"),
  order(10447, "Dylan Foster", "delivered", 1900, stickers(15), us("4 Elm Ct", "Spokane", "WA", "99201"), "2026-09-20"),
  order(10448, "Elena Costa", "paid", 3100, poster(1), us("120 Pearl St", "Denver", "CO", "80203"), "2026-10-09"),
  order(10449, "Arjun Mehta", "paid", 2200, poster(1), us("38 Cherry Ln", "Durham", "NC", "27701"), "2026-10-11"),
  order(10450, "Sara Johnson", "paid", 2900, tee(1), us("5 Linden St", "Ithaca", "NY", "14850"), "2026-10-08"),
  order(10452, "Yuki Tanaka", "paid", 3300, poster(1), us("67 Sunset Blvd", "Los Angeles", "CA", "90028"), "2026-10-09"),
  order(10454, "Adam Novak", "paid", 2800, poster(1), us("210 Main St", "Fort Collins", "CO", "80524"), "2026-10-10"),
];

function ship(n: number, trackingNumber: string, eta: string, shippedOn: string): SeedShipment {
  const carrier = trackingNumber.startsWith("PW")
    ? "Parcelwise"
    : trackingNumber.startsWith("SP")
      ? "SwiftPost"
      : "Northline";
  return {
    orderNumber: orderNumber(n),
    carrier,
    trackingNumber,
    eta,
    shippedAt: `${shippedOn}T15:00:00Z`,
  };
}

export const SEED_SHIPMENTS: SeedShipment[] = [
  ship(10401, "PW4419203871", "2026-10-14", "2026-10-09"),
  ship(10402, "SP220194837US", "2026-10-13", "2026-10-08"),
  ship(10403, "NL7730018842", "2026-10-16", "2026-10-10"),
  ship(10404, "PW4419102266", "2026-09-26", "2026-09-23"),
  ship(10405, "SP220201955US", "2026-10-15", "2026-10-10"),
  ship(10406, "NL7729904413", "2026-10-14", "2026-10-08"),
  ship(10408, "PW4419200017", "2026-10-13", "2026-10-07"),
  ship(10410, "SP220188120US", "2026-10-14", "2026-10-09"),
  ship(10411, "PW4419187734", "2026-10-14", "2026-10-08"),
  ship(10412, "NL7729981050", "2026-10-15", "2026-10-09"),
  ship(10427, "SP220199402US", "2026-10-13", "2026-10-07"),
  ship(10430, "PW4419011845", "2026-09-29", "2026-09-25"),
  ship(10431, "NL7729510377", "2026-09-22", "2026-09-18"),
  ship(10432, "SP220104466US", "2026-10-01", "2026-09-28"),
  ship(10433, "PW4419020398", "2026-09-30", "2026-09-26"),
  ship(10434, "NL7729644120", "2026-10-02", "2026-09-29"),
  ship(10435, "PW4418990215", "2026-09-26", "2026-09-23"),
  ship(10436, "SP220122907US", "2026-10-03", "2026-09-30"),
  ship(10437, "NL7729550841", "2026-09-28", "2026-09-24"),
  ship(10438, "PW4419045563", "2026-10-01", "2026-09-28"),
  ship(10439, "SP220190311US", "2026-10-15", "2026-10-09"),
  ship(10440, "NL7729520964", "2026-09-29", "2026-09-25"),
  ship(10442, "PW4419002771", "2026-09-28", "2026-09-24"),
  ship(10443, "SP220160734US", "2026-10-13", "2026-10-06"),
  ship(10444, "NL7729530682", "2026-09-28", "2026-09-24"),
  ship(10445, "PW4419150290", "2026-10-14", "2026-10-08"),
  ship(10446, "SP220140519US", "2026-10-13", "2026-10-02"),
  ship(10447, "NL7729480913", "2026-09-27", "2026-09-23"),
];

function proof(n: number, status: SeedProof["status"], updatedOn: string): SeedProof {
  return { orderNumber: orderNumber(n), status, updatedAt: `${updatedOn}T12:00:00Z` };
}

export const SEED_PROOFS: SeedProof[] = [
  proof(10413, "sent", "2026-10-09"),
  proof(10414, "approved", "2026-10-03"),
  proof(10415, "pending", "2026-10-10"),
  proof(10416, "changes_requested", "2026-10-08"),
  proof(10417, "sent", "2026-10-08"),
  proof(10418, "approved", "2026-10-05"),
  proof(10420, "sent", "2026-10-09"),
  proof(10450, "sent", "2026-10-09"),
  proof(10452, "sent", "2026-10-10"),
];
