# -*- coding: utf-8 -*-
"""Chapters 6-10 of the ChainGuard v2 technical seminar report (compact edition)."""

BLOCKS_B = [
    # ------------------------------------------------------------------ 6
    ("h1", "6. ADVANTAGES AND LIMITATIONS"),
    ("h2", "6.1 Advantages"),
    ("bul", [
        "**One invariant replaces four records.** Seal, attestation, telemetry and return count are fields of one dispatch, so stock is reconciled before systems are.",
        "**Consent is explicit and single-use.** A break requires a customer-issued token visible to the customer, driver and auditor, applying least privilege to a physical event [10].",
        "**Reconciliation is unit-exact.** Expected return is the declared buffer and variance is computed from counted units, with the same arithmetic driving alert, status and payout.",
        "**Settlement is gated by the count.** A non-zero variance locks settlement immediately, which makes explaining a discrepancy necessary rather than optional.",
        "**Evidence is assembled at the event.** Incidents carry GPS and time, attestations carry a note and token, and returns carry operator counts.",
        "**The four views cannot drift.** Every portal reads one store, so a vendor change is visible in the audit plane without a refresh.",
        "**Deployment is reproducible.** A static bundle on a CDN with no backend or secrets lets a reviewer reproduce the fraud case in under a minute.",
    ]),
    ("h2", "6.2 Limitations / Challenges"),
    ("bul", [
        "**The trust boundary is the browser.** The role switch is not authentication and `localStorage` can be edited. Production needs server-side identity, role-based access control and an append-only store.",
        "**Identifiers are not secrets.** Seal and token values come from `Math.random`; production needs a CSPRNG and server-side signature verification [15].",
        "**No hardware seal or real scan.** The QR panel is rendered, not scanned, so physical tamper evidence is not demonstrated.",
        "**No backend or multi-device sync.** State is local to one browser; four devices would not share a record.",
        "**Settlement is a flag, not a payment.** `payoutLocked` stops nothing outside the interface.",
        "**Weights are policy, not measurement.** The 22, 4 and 3 penalties were chosen for legibility and could create incentives to hide incidents.",
        "**The buffer is declared, not measured.** A misloaded buffer makes reconciliation consistently wrong; the plane verifies custody against the manifest, not the manifest against the load.",
        "**Privacy and retention are unresolved.** Real addresses and notes would require minimisation, retention limits and a basis consistent with the DPDP Act, 2023.",
        "**Evidence is not immutable.** The interface mentions an immutable audit log, but the prototype stores mutable JSON; no hash is computed and no external anchor exists.",
    ]),
    ("p", "The interface honesty point deserves emphasis: the alert footer reads “Evidence hash anchored · immutable audit log”, but no hash chain exists. Before the interface is shown to an auditor, that copy should read “session audit trail” or be backed by a real hash chain. Scale is a second qualification: six dispatches and five drivers are responsive, but KPI and scorecard functions scan the full list on every render and would need indexed queries at fleet scale."),

    # ------------------------------------------------------------------ 7
    ("h1", "7. COMPARISON WITH EXISTING TECHNOLOGIES"),
    ("p", "ChainGuard is best positioned against a telematics or transport management system, an electronic proof of delivery and a blockchain traceability platform. Table 7.1 compares them on custody capabilities rather than feature count."),
    ("tbl", {
        "caption": "Table 7.1: Feature matrix comparison with existing approaches.",
        "headers": ["Capability", "ChainGuard v2", "Telematics / TMS", "Paper POD / ePOD", "Blockchain traceability"],
        "widths": [1.05, 1.28, 1.12, 1.12, 1.18],
        "size": 7.4,
        "rows": [
            ["Primary question", "What is the custody state and who is accountable?", "Where is the vehicle and when will it arrive?", "What did the customer sign for?", "Can the record be trusted across parties?"],
            ["Seal identity", "Unique SEAL-####-C per dispatch", "Not modelled", "Signature or photograph", "Asset identifier on a ledger"],
            ["Authorised break", "Customer-issued single-use token", "Not modelled", "Paper signature", "Smart-contract condition"],
            ["Quantity invariant", "Buffer returned unit-for-unit", "Usually not tracked", "Exception note", "Tokenised if the data is correct"],
            ["Reconciliation", "Automated; variance locks payout", "Manual or back office", "Manual", "Automated only with a trusted oracle"],
            ["Settlement gate", "Payout locked on variance", "Invoice-based", "Not applicable", "Possible through contract logic"],
            ["Incident evidence", "GPS- and time-stamped beacons", "Telematics vendor portal", "Call-centre note", "On-chain hash, if captured"],
            ["Infrastructure", "Static SPA, no backend", "Server, devices and subscriptions", "Paper or PDF", "Consortium network and governance"],
            ["Audit immutability", "Session-level freeze only", "Vendor audit log", "Physical archive", "Ledger-level, oracle-dependent"],
        ],
    }),
    ("p", "ChainGuard is narrower than a TMS and deeper than an ePOD. A TMS optimises movement and cost but rarely knows how many buffer units should return; an ePOD captures acceptance without enforcing a quantity invariant or linking acceptance to settlement. ChainGuard occupies the custody decision between arrival and payment."),
    ("p", "Blockchain traceability is closest in intent but furthest in infrastructure: a ledger provides integrity once an event is written, but still trusts a party to write the physical count and requires governance to define a valid event [5], [6]. For one fleet, an authenticated hash-chained log delivers most of that assurance at a fraction of the cost; a ledger pays off only when several organisations share one record."),

    # ------------------------------------------------------------------ 8
    ("h1", "8. FUTURE SCOPE"),
    ("num", [
        "**Server-side custody service.** Move the store behind an authenticated API with role-based access control, tenant isolation and an append-only event table.",
        "**Signed tokens and hardware seals.** Replace random identifiers with CSPRNG tokens signed using HMAC or Ed25519, and integrate an NFC or BLE tamper loop.",
        "**Hash-chained audit log.** Roll a hash over each custody event and anchor periodic digests to a timestamping service or permissioned ledger.",
        "**Offline-first driver app.** Package the driver portal as an installable progressive web app with queued, signed batch upload.",
        "**Settlement integration.** Connect `payoutLocked` to a payout service with an explicit release workflow and exchange data with warehouse and ERP systems.",
        "**Risk analytics and governance.** Calibrate the trust score against outcomes, test it for bias [14], and add data minimisation, retention limits and access logging.",
    ]),

    # ------------------------------------------------------------------ 9
    ("h1", "9. CONCLUSION"),
    ("p", "Last-mile shrinkage is usually treated as a counting problem at the end of a journey. This report has argued that it is a custody problem at the beginning: buffer stock leaves a warehouse under a seal and returns without a rule binding its expected quantity to the evidence of what happened. Without it the final count has no authority and settlement proceeds regardless."),
    ("p", "ChainGuard v2 makes the rule executable. Each dispatch binds one seal and one buffer; the seal breaks only with a customer-issued single-use token; telemetry and incidents share the record; and check-in reconciles unit-for-unit, with variance voiding the seal, locking payout and raising a priority-1 alert."),
    ("p", "The prototype demonstrates the full workflow, a seeded fleet covering every state and a reproducible fraud case, while stating its limits: client-side trust, non-cryptographic identifiers, settlement as a flag and a mutable audit log. Its broader contribution is a design pattern — one active seal, consent before break, buffer as expected return and variance as a settlement gate — simple to audit and applicable to pharmacy, retail, food and third-party fleets."),

    # ------------------------------------------------------------------ 10
    ("h1", "10. REFERENCES"),
    ("ref", "Christopher, M. (2016). Logistics & Supply Chain Management (5th ed.). Harlow: Pearson Education."),
    ("ref", "Olsson, J., Hellström, D., & Pålsson, H. (2019). Framework of last mile logistics research: A systematic review. Sustainability, 11(24), 7131."),
    ("ref", "Mangiaracina, R., Perego, A., Seghezzi, A., & Tumino, A. (2019). Innovative solutions to increase last-mile delivery efficiency in B2C e-commerce. International Journal of Physical Distribution & Logistics Management, 49(9), 901–920."),
    ("ref", "Boysen, N., de Koster, R., & Weidinger, F. (2019). Warehousing in the e-commerce era: A survey. European Journal of Operational Research, 277(2), 396–411."),
    ("ref", "Kshetri, N. (2018). Blockchain’s roles in meeting key supply chain management objectives. International Journal of Information Management, 39, 80–89."),
    ("ref", "Azzi, R., Chamoun, R. K., & Sokhn, M. (2019). The power of a blockchain-based supply chain. Computers & Industrial Engineering, 135, 582–592."),
    ("ref", "Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). Zero Trust Architecture (NIST SP 800-207). Gaithersburg, MD: NIST."),
    ("ref", "Beck, A. (2016). Beyond Shrinkage: Introducing Total Retail Loss. ECR Retail Loss Group."),
    ("ref", "World Wide Web Consortium. (2022). Verifiable Credentials Data Model 1.1 (W3C Recommendation). https://www.w3.org/TR/vc-data-model/"),
    ("ref", "Saltzer, J. H., & Schroeder, M. D. (1975). The protection of information in computer systems. Proceedings of the IEEE, 63(9), 1278–1308."),
    ("ref", "International Organization for Standardization. (2007). ISO 22005:2007 — Traceability in the feed and food chain. Geneva: ISO."),
    ("ref", "DHL Trend Research. (2015). Internet of Things in Logistics. Troisdorf: DHL Customer Solutions & Innovation."),
    ("ref", "Bouzembrak, Y., Klüche, M., Gavai, A., & Marvin, H. J. P. (2019). Internet of Things in food safety: A review. Trends in Food Science & Technology, 94, 65–74."),
    ("ref", "Martin, K. (2019). Ethical implications and accountability of algorithms. Journal of Business Ethics, 160, 835–850."),
    ("ref", "National Institute of Standards and Technology. (2008). The Keyed-Hash Message Authentication Code (HMAC) (FIPS PUB 198-1). Gaithersburg, MD: NIST."),
    ("ref", "Vivek16-Py. (2026). ChainGuard v2: Last-Mile Integrity Control Plane [Computer software]. https://github.com/Vivek16-Py/chainguard-v2"),
]
