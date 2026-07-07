import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const scaleSteps = [
  {
    code: "01",
    title: "Add one useful point",
    body: "Open a shop only where it shortens a real route, increases bag fill, or gives riders a cleaner handoff.",
    metric: "5-8 active points",
  },
  {
    code: "02",
    title: "Watch density, not territory",
    body: "A neighborhood is ready when parcels, direction bags, and rider overlap repeat without manual dispatch.",
    metric: "3+ bags per lane",
  },
  {
    code: "03",
    title: "Delay the depot decision",
    body: "A depot is only justified after the ledger proves sorting volume, staffing load, and rent can beat the shop mesh.",
    metric: "depot gate locked",
  },
];

const scaleSignals = [
  ["Point density", "12 shops", "before fixed hub rent"],
  ["Bag fill", "68%", "enough volume to bundle"],
  ["Rider overlap", "41%", "routes already crossing"],
  ["Depot trigger", "not yet", "density data decides"],
];

const scaleChecks = [
  ["Open point", "Only when it reduces distance or creates a reliable handoff lane."],
  ["Keep shops light", "No printers, no warehouse shift, no full parcel sorting room."],
  ["Let data decide", "Depot rent waits until repeated bags prove a fixed site earns more than it costs."],
];

const cycleNodes = [
  {
    key: "shop",
    label: "Shop",
    title: "A shop becomes a point",
    body: "A trusted shop accepts parcels, writes the local code, and keeps the work lightweight.",
    stat: "5-8 points",
    x: "50%",
    y: "13.3%",
  },
  {
    key: "bag",
    label: "Bag",
    title: "Direction bags prove volume",
    body: "Repeated sealed bags show which local lanes are real before rent is committed.",
    stat: "18/day lane",
    x: "84.8%",
    y: "37.1%",
  },
  {
    key: "rider",
    label: "Rider",
    title: "Riders clear existing movement",
    body: "The system prefers riders already crossing the lane instead of creating a fresh trip.",
    stat: "41% overlap",
    x: "71.9%",
    y: "80%",
  },
  {
    key: "ledger",
    label: "Ledger",
    title: "The ledger decides the next point",
    body: "Open another point only when fill rate, handoff time, and payout data repeat.",
    stat: "7 day gate",
    x: "28.1%",
    y: "80%",
  },
  {
    key: "candidate",
    label: "P5",
    title: "Candidate point opens last",
    body: "P5 stays a candidate until the existing P2-P4 lane repeats without manual help.",
    stat: "hold depot",
    x: "15.2%",
    y: "37.1%",
  },
];

const compareRows = [
  ["Capital", "Add one shop", "Lease depot first"],
  ["Proof", "Real bags repeat", "Forecasted volume"],
  ["Risk", "Reversible point", "Fixed rent drag"],
  ["Scale trigger", "Ledger gates P5", "Manager approval"],
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
    <section className="motion-island scale-section" aria-labelledby="proof-title">
      <div className="scale-section-inner">
        <div className="section-heading scale-heading">
          <div>
            <p className="eyebrow">Why it can scale</p>
            <h2 id="proof-title">Scale by adding points, not depots.</h2>
          </div>
          <div className="scale-heading-copy">
            <p>
              The network grows by proving local density first. Shops absorb intake and sort work while the ledger decides
              when a fixed depot is finally worth the cost.
            </p>
            <div className="scale-heading-decision">
              <span>Current decision</span>
              <strong>Add point P5, hold depot</strong>
            </div>
          </div>
        </div>

        <div className="scale-check-grid" aria-label="Scale operating checks">
          {scaleChecks.map(([title, body]) => (
            <article key={title}>
              <span>{title}</span>
              <p>{body}</p>
            </article>
          ))}
        </div>

        <motion.div
          className="scale-system"
          initial={false}
        >
          <motion.div
            className="scale-cycle-panel"
            initial={false}
          >
            <div className="scale-panel-head">
              <span>Point-first expansion</span>
              <strong>No depot yet</strong>
            </div>
            <div className="scale-cycle-layout" aria-label="Point-first expansion cycle">
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

                    return (
                      <motion.path
                        animate={{
                          opacity: shouldDraw ? 1 : 0,
                          pathLength: shouldDraw ? 1 : 0,
                        }}
                        className={`scale-cycle-live ${isActive ? "is-loading" : ""}`}
                        d={segment}
                        initial={isActive ? { opacity: 0, pathLength: 0 } : false}
                        key={`live-${index}-${isActive ? flowStep : "idle"}`}
                        transition={{
                          opacity: { duration: isActive ? 0.18 : 0.12, ease: "easeOut" },
                          pathLength: { duration: isActive ? 1.45 : 0.18, ease: [0.45, 0, 0.18, 1] },
                        }}
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
                  <span>MtaaLink mesh</span>
                  <strong>point-first</strong>
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
                  <strong>Current gate</strong>
                  <em>{activeCycle.key === "candidate" ? "hold P5 until lane repeats" : "keep proving density"}</em>
                </div>
              </div>
            </div>
            <div className="scale-compare">
              <div className="scale-compare-head">
                <span>Expansion logic</span>
                <strong>MtaaLink vs depot-first</strong>
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
          </motion.div>

          <motion.div
            className="scale-rules-panel"
            initial={false}
          >
            <div className="scale-panel-head">
              <span>Expansion gates</span>
              <strong>Measured</strong>
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
              <span>Depot decision matrix</span>
              <div>
                <strong>Open more shops</strong>
                <p>Low rent, local staff, faster proof of real parcel density.</p>
              </div>
              <div>
                <strong>Hold depot</strong>
                <p>No repeated sort load yet; fixed rent would hide whether the mesh works.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="scale-signal-strip"
            initial={false}
          >
            {scaleSignals.map(([label, value, note]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{note}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
