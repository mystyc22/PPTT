/** @jsxRuntime classic */
import React, { useEffect, useState } from "react";

const scaleSteps = [
  {
    code: "01",
    title: "Add Nodes Where They Shorten Distance",
    body: "Onboard the next partner shop where it increases network density, improves bag fill rates, and shortens courier transfers.",
    metric: "cluster gate",
  },
  {
    code: "02",
    title: "Measure Density, Not Warehouse Area",
    body: "A corridor reaches maturity when directional bags and rider transfers cycle smoothly without manual intervention.",
    metric: "3+ bags per route",
  },
  {
    code: "03",
    title: "Eliminate Fixed Warehouse Leases",
    body: "Central warehouses are obsolete—a distributed mesh of local shops and motorcycles is cheaper, more agile, and immune to urban traffic gridlock.",
    metric: "zero fixed rent",
  },
];

const scaleSignals = [
  ["Hub Density", "pilot cluster", "zero warehouse lease"],
  ["Bag Fill Rate", "scale threshold", "minimum to clear corridor"],
  ["Rider Flow", "organic traffic", "transfers along natural routes"],
  ["Central Depots", "unnecessary", "decided by live transit data"],
];

const scaleChecks = [
  ["Open a Hub", "Only where it shortens distance and establishes reliable node-to-node connectivity."],
  ["Asset-Light Nodes", "Zero printers, zero warehouse payroll; a single counter shelf is all it takes."],
  ["Data-Driven Mesh", "Network density grows organically based on verified parcel bag velocities."],
];

const cycleNodes = [
  {
    key: "shop",
    label: "Hub",
    title: "Local Shop Becomes a Hub",
    body: "Merchant receives the parcel, marks the 4-character code, and places it into the target directional bag.",
    stat: "hub cluster",
    x: "50%",
    y: "13.3%",
  },
  {
    key: "bag",
    label: "Bag",
    title: "Max 8 Directional Bags",
    body: "Sealed transit bag batches parcels traveling in the same direction. Stays sealed until destination sector.",
    stat: "8 corridors",
    x: "84.8%",
    y: "37.1%",
  },
  {
    key: "rider",
    label: "Rider",
    title: "Private Carriers (Moto-Taxi)",
    body: "Boda-boda riders waiting at stands pick up sealed bags along their natural route, minimizing empty return trips.",
    stat: "freight exchange",
    x: "71.9%",
    y: "80%",
  },
  {
    key: "ledger",
    label: "Ledger",
    title: "Ledger Clears Hop by Hop",
    body: "The parcel pays for its own transit in digital balance. Hubs and riders receive payments instantly upon handover.",
    stat: "balance audit",
    x: "28.1%",
    y: "80%",
  },
  {
    key: "candidate",
    label: "P5",
    title: "Organic Node P5",
    body: "A new shop activates automatically when an adjacent hub approaches throughput limits.",
    stat: "flat mesh",
    x: "15.2%",
    y: "37.1%",
  },
];

const compareRows = [
  ["Capital Expenditure (CAPEX)", "Onboard existing shops", "Lease & build sorting hubs"],
  ["Validation", "Actual bag throughput", "Speculative paper projections"],
  ["Operational Risk", "Flexible merchant partners", "Fixed warehouse lease commitments"],
  ["Network Orchestration", "Automated event ledger", "Manual dispatch call centers"],
];

const cycleSegments = [
  "M210 56 A156 156 0 0 1 356 156",
  "M356 156 A156 156 0 0 1 302 336",
  "M302 336 A156 156 0 0 1 118 336",
  "M118 336 A156 156 0 0 1 64 156",
  "M64 156 A156 156 0 0 1 210 56",
];

function CycleIcon({ type }: { type: string }) {
  if (type === "shop") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10h16l-1.2-5.2H5.2L4 10Z" />
        <path d="M6 10v9h12v-9" />
        <path d="M9 19v-5h6v5" />
      </svg>
    );
  }
  if (type === "bag") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 8h10l1 12H6L7 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
        <path d="M9 13h6" />
      </svg>
    );
  }
  if (type === "rider") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="7" cy="17" r="3" />
        <circle cx="17" cy="17" r="3" />
        <path d="M10 17h3l2-6h-3l-2 3H8" />
        <path d="M14 7h.01" />
      </svg>
    );
  }
  if (type === "ledger") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10v16H7V4Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v18" />
      <path d="M5 12h14" />
      <path d="m15 8 4 4-4 4" />
    </svg>
  );
}

export default function InvestorMotion() {
  const [flowStep, setFlowStep] = useState(0);
  const activeIndex = flowStep % cycleNodes.length;
  const nextIndex = (activeIndex + 1) % cycleNodes.length;
  const activeCycle = cycleNodes[activeIndex];
  const nextCycle = cycleNodes[nextIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFlowStep((step) => step + 1);
    }, 2200);

    return () => window.clearInterval(timer);
  }, []);

  const activateCycle = (key: string) => {
    const nextIndex = cycleNodes.findIndex((node) => node.key === key);
    if (nextIndex < 0) return;

    setFlowStep((step) => {
      const currentIndex = step % cycleNodes.length;
      const forwardDelta = (nextIndex - currentIndex + cycleNodes.length) % cycleNodes.length;
      return step + forwardDelta;
    });
  };

  return (
    <section
      className="motion-island scale-section"
      aria-labelledby="proof-title"
    >
      <div className="scale-section-inner">
        <div className="section-heading scale-heading">
          <div>
            <p className="eyebrow">Scaling Architecture</p>
            <h2 id="proof-title">Scale Through Shop Networks, Not Central Warehouses.</h2>
          </div>
          <div className="scale-heading-copy">
            <p>
              The network expands organically with parcel volume. Local merchants handle intake and simple directional sorting,
              while independent riders power transit without expensive central sorting hubs.
            </p>
            <div className="scale-heading-decision">
              <span>Current Stage</span>
              <strong>Activate node P5, defer central warehouse build</strong>
            </div>
          </div>
        </div>

        <div className="scale-check-grid" aria-label="Operational scaling criteria">
          {scaleChecks.map(([title, body]) => (
            <article key={title}>
              <span>{title}</span>
              <p>{body}</p>
            </article>
          ))}
        </div>

        <div
          className="scale-system"
        >
          <div
            className="scale-cycle-panel"
          >
            <div className="scale-panel-head">
              <span>Micro-Hub Network Expansion</span>
              <strong>Zero Fixed Warehouses</strong>
            </div>
            <div className="scale-cycle-layout" aria-label="Hub network expansion cycle">
              <div className="scale-cycle-orbit">
                <svg className="scale-cycle-lines" viewBox="0 0 420 420" aria-hidden="true">
                  {cycleSegments.map((segment, index) => (
                    <path
                      className="scale-cycle-base"
                      d={segment}
                      key={`base-${segment}`}
                    />
                  ))}
                  {cycleSegments.map((segment, index) => {
                    const isComplete = index < activeIndex;
                    const isActive = index === activeIndex;
                    const shouldDraw = isComplete || isActive;

                    if (!shouldDraw) return null;

                    return (
                      <path
                        className={`scale-cycle-live ${isActive ? "is-loading" : ""}`}
                        d={segment}
                        key={`live-${index}-${isActive ? flowStep : "idle"}`}
                        pathLength={1}
                      />
                    );
                  })}
                  <path className="scale-cycle-spoke" d="M210 210 L210 56" />
                  <path className="scale-cycle-spoke" d="M210 210 L356 156" />
                  <path className="scale-cycle-spoke" d="M210 210 L302 336" />
                  <path className="scale-cycle-spoke" d="M210 210 L118 336" />
                  <path className="scale-cycle-spoke" d="M210 210 L64 156" />
                </svg>
                <div className="scale-cycle-core">
                  <span>PPTT Mesh</span>
                  <strong>hub-to-hub</strong>
                  <small>{activeCycle.label}{" -> "}{nextCycle.label}</small>
                </div>
                {cycleNodes.map((node, nodeIndex) => (
                  <button
                    className={`scale-cycle-node ${node.key === activeCycle.key ? "is-active" : ""} ${nodeIndex === nextIndex ? "is-next" : ""}`}
                    key={node.key}
                    type="button"
                    style={{ left: node.x, top: node.y }}
                    onClick={() => activateCycle(node.key)}
                    onFocus={() => activateCycle(node.key)}
                    onMouseEnter={() => activateCycle(node.key)}
                  >
                    <span>
                      <CycleIcon type={node.key} />
                    </span>
                    <strong>{node.label}</strong>
                  </button>
                ))}
              </div>
              <div className="scale-cycle-detail">
                <span>{activeCycle.stat}</span>
                <h3>{activeCycle.title}</h3>
                <p>{activeCycle.body}</p>
                <div className="scale-cycle-status">
                  <strong>Gate Status</strong>
                  <em>{activeCycle.key === "candidate" ? "activate P5 once corridor stabilizes" : "scale network density"}</em>
                </div>
              </div>
            </div>
            <div className="scale-compare">
              <div className="scale-compare-head">
                <span>Model Comparison</span>
                <strong>PPTT vs Central Sorting Warehouses</strong>
              </div>
              <div className="scale-compare-grid">
                {compareRows.map(([label, mesh, depot]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{mesh}</strong>
                    <em>{depot}</em>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="scale-rules-panel"
          >
            <div className="scale-panel-head">
              <span>Growth Criteria</span>
              <strong>Verifiable</strong>
            </div>
            <div className="scale-rules">
              {scaleSteps.map((step) => (
                <article className="scale-rule" key={step.code}>
                  <span>{step.code}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                    <strong>{step.metric}</strong>
                  </div>
                </article>
              ))}
            </div>
            <div className="scale-depot-decision">
              <span>Infrastructure Strategy</span>
              <div>
                <strong>Onboard Local Shops</strong>
                <p>Zero lease overhead, local merchant engagement, instant zero-risk scale.</p>
              </div>
              <div>
                <strong>Avoid Central Sorting Depots</strong>
                <p>Central sorting hubs introduce single points of failure and crushing fixed costs in address-less cities.</p>
              </div>
            </div>
          </div>

          <div
            className="scale-signal-strip"
          >
            {scaleSignals.map(([label, value, note]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

