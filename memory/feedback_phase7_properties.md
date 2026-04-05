---
name: Phase 7 property mechanic decisions
description: User-confirmed design decisions for Apartment/House mechanics — buy prompt, independent prison mechanic, tile label ownership display
type: feedback
---

**Buy prompt, not auto-buy:** When a player lands on an unowned property, show a choice prompt (buy or pass). Do not auto-purchase even if the player can afford it.
**Why:** Consistent with other interactive tiles (Sports Betting, Gym Membership). Gives players agency.
**How to apply:** Implement a `WAITING_FOR_PROPERTY_DECISION` turn phase; advance turn if player passes.

**Independent can't-pay mechanic:** When a visitor can't afford rent, give all cash to owner then send to Prison — but implement this as a property-specific code path, NOT by calling or sharing the Phase 6 prison logic.
**Why:** User doesn't want property mechanics coupled to prison mechanics. If prison rules change later, it shouldn't affect property defaults.
**How to apply:** Inline the "set position=10, set imprisoned flag" logic inside the property handler rather than calling a shared helper.

**No landlord hat:** Remove character portrait landlord hat requirement. Instead, the host board tile label changes to "[PlayerName]'s Apartment" or "[PlayerName]'s House" on purchase.
**Why:** Simpler, more readable, avoids dependency on Phase 11 character portrait system.
**How to apply:** Broadcast a `property-purchased` event with `{ tileIndex, ownerName }` so the client can update the tile label on the host board.

**PROP-04 is the tile-label requirement** (not the landlord hat). REQUIREMENTS.md updated accordingly.
