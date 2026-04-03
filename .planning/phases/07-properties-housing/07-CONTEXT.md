# Phase 7: Properties & Housing — Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Source:** Pre-planning assumptions review (user-confirmed decisions)

<domain>
## Phase Boundary

Implement Apartment (Tile 6) and House (Tile 25) as ownable properties. A player landing on an unowned property is prompted to buy it. A player landing on a property they don't own pays rent to the owner. A player who can't afford rent forfeits all cash to the owner and is sent to Prison. Owner landing on their own property: no charge, advance turn normally.

Host board tile labels update dynamically to show ownership (e.g., "Chewy's House").

**Out of scope:** selling property, mortgaging, ownership transfer, landlord hat/character portrait changes (Phase 11).

</domain>

<decisions>
## Implementation Decisions

### Property State
- Property ownership tracked on `GameRoom` (not on `Player`) as a `properties` map: `{ APARTMENT: playerId | null, HOUSE: playerId | null }`
- No new Player fields required for ownership tracking

### Buy Mechanic
- **Player choice prompt** (NOT auto-buy): when a player lands on an unowned property, emit a `property-buy-prompt` event to the active player's socket with the tile info and cost
- Introduce `WAITING_FOR_PROPERTY_DECISION` as a new turn phase to pause turn flow while awaiting player response
- Player can choose: Buy or Pass
- If player passes (or can't afford): tile remains unowned, turn advances normally
- Purchase deducts cash from player; ownership recorded on room state

### Rent Mechanic
- **Apartment**: rent = 25% of visitor's `salary` (not current cash)
- **House**: rent = 50% of visitor's `salary` (not current cash)
- Rent deducted from visitor, added to owner's `money`
- Owner landing on their own tile: skip charge, advance turn

### Can't-Pay Mechanic
- If visitor's `money < rent`, they are in default:
  1. Transfer all visitor cash to owner (`owner.money += visitor.money; visitor.money = 0`)
  2. Send visitor to Prison (Tile 10) via **independent inline logic** — do NOT call or share code with the Phase 6 prison handlers (`handlePrisonEscape`, `handlePrisonBail`)
  3. Inline: set `visitor.inPrison = true`, `visitor.prisonTurns = 0`, `visitor.inHospital = false`, `visitor.inJapan = false`, `visitor.position = 10`
  4. Emit a dedicated `property-default` event (distinct from `prison-entered`)
- This decoupling is intentional: property default → prison is independent of Phase 6 Prison mechanics

### Host Board Display
- On purchase, broadcast `property-purchased` event: `{ tileIndex, ownerName, tileName }`
- Client updates the host board tile label to "[OwnerName]'s Apartment" / "[OwnerName]'s House"
- No landlord hat or character portrait changes in this phase

### Socket Events
- `property-buy-prompt` — server → active player: `{ tileIndex, tileName, cost, currentMoney }`
- `buy-property` — client → server: `{ accept: boolean }` (player's choice)
- `property-purchased` — server → room: `{ tileIndex, ownerName, tileName, buyerName, cost }`
- `property-rent-paid` — server → room: `{ tileIndex, visitorName, ownerName, rentAmount }`
- `property-default` — server → room: `{ tileIndex, visitorName, ownerName, cashTransferred }`

### Claude's Discretion
- Test file name: `tests/properties.test.ts`
- Turn phase constant name: `WAITING_FOR_PROPERTY_DECISION` (add to `TURN_PHASES` object)
- Exact timeout/fallback if player doesn't respond to buy prompt: advance turn after normal timeout (same pattern as other interactive events, or simply treat no response as "pass")

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Server Architecture
- `server.ts` — Full server source; read before writing any new handlers. Property tile stubs at lines ~957-960 (APARTMENT/HOUSE fall through to `default: advanceTurn`). TURN_PHASES object, GameRoom interface, Player interface all defined here.

### Game Design
- `.planning/GAME-DESIGN.md` — Authoritative spec. Tile 6 (Apartment) and Tile 25 (House) definitions are the source of truth for costs and rent rates.

### Requirements
- `.planning/REQUIREMENTS.md` — Updated PROP-01..04 (as of 2026-04-03)

### Roadmap
- `.planning/ROADMAP.md` — Phase 7 success criteria

### Test Patterns
- `tests/hospital.test.ts` — Reference for how Phase 6 tile handlers are tested (setup, socket mocking, assertion patterns)
- `tests/prison.test.ts` — Reference for imprisoned-player state assertions

</canonical_refs>

<specifics>
## Specific Values

| Property | Tile | Buy Cost | Rent | Rent Basis |
|----------|------|----------|------|------------|
| Apartment | 6 | 50,000 | 25% | Visitor's salary |
| House | 25 | 100,000 | 50% | Visitor's salary |

**Starting salary:** 10,000 (so starting rent: 2,500 / 5,000)

**Prison tile position:** 10

**Can't-pay threshold:** `visitor.money < rentAmount` (strict less-than — if exactly equal, player can pay)

</specifics>

<deferred>
## Deferred

- Landlord hat / character portrait ownership layer → Phase 11
- Property selling / mortgaging → not in v1 scope
- Multiple properties per player → not applicable (only 2 properties in game)
</deferred>

---

*Phase: 07-properties-housing*
*Context gathered: 2026-04-03 via pre-planning assumptions review*
