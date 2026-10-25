import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const topbar = document.querySelector<HTMLElement>("[data-topbar]");

if (topbar) {
  const navLinks = Array.from(topbar.querySelectorAll<HTMLAnchorElement>(".nav-links a[href^='#']"));
  const navToggle = topbar.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const navTargets = navLinks
    .map((link) => {
      const section = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      return section ? { link, section } : null;
    })
    .filter((item): item is { link: HTMLAnchorElement; section: HTMLElement } => Boolean(item));

  const setMenuOpen = (isOpen: boolean) => {
    topbar.classList.toggle("is-menu-open", isOpen);
    navToggle?.setAttribute("aria-expanded", String(isOpen));
    navToggle?.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  };

  const updateTopbar = () => {
    const scrollY = window.scrollY;
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollProgress = Math.min(1, Math.max(0, scrollY / scrollRange));
    const activeY = scrollY + window.innerHeight * 0.32;
    let activeLink: HTMLAnchorElement | null = null;

    for (const { link, section } of navTargets) {
      if (section.offsetTop <= activeY) {
        activeLink = link;
      }
    }

    topbar.classList.toggle("is-scrolled", scrollY > 18);
    topbar.style.setProperty("--nav-progress", scrollProgress.toFixed(3));
    navLinks.forEach((link) => link.classList.toggle("is-active", link === activeLink));
  };

  let topbarFrame = 0;
  const queueTopbarUpdate = () => {
    if (topbarFrame) return;
    topbarFrame = window.requestAnimationFrame(() => {
      topbarFrame = 0;
      updateTopbar();
    });
  };

  updateTopbar();
  window.addEventListener("scroll", queueTopbarUpdate, { passive: true });
  window.addEventListener("resize", queueTopbarUpdate, { passive: true });

  navToggle?.addEventListener("click", () => {
    setMenuOpen(!topbar.classList.contains("is-menu-open"));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof Node && !topbar.contains(target)) setMenuOpen(false);
  });
}

if (!reduceMotion) {
  const lenis = new Lenis({
    anchors: true,
    autoRaf: false,
    duration: 1.05,
    smoothWheel: true,
    syncTouch: false,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

const dot = document.querySelector<HTMLElement>(".cursor-dot");
const ring = document.querySelector<HTMLElement>(".cursor-ring");

if (dot && ring && window.matchMedia("(pointer: fine)").matches) {
  document.documentElement.classList.add("has-custom-cursor");

  const cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const follower = { x: cursor.x, y: cursor.y };

  window.addEventListener("mousemove", (event) => {
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    dot.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0) translate(-50%, -50%)`;
  });

  gsap.ticker.add(() => {
    follower.x += (cursor.x - follower.x) * 0.18;
    follower.y += (cursor.y - follower.y) * 0.18;
    ring.style.transform = `translate3d(${follower.x}px, ${follower.y}px, 0) translate(-50%, -50%)`;
  });

  document.querySelectorAll<HTMLElement>(".magnetic, a, button, input, select, textarea").forEach((element) => {
    element.addEventListener("mouseenter", () => {
      dot.classList.add("is-active");
      ring.classList.add("is-active");
    });
    element.addEventListener("mouseleave", () => {
      dot.classList.remove("is-active");
      ring.classList.remove("is-active");
    });
  });

  topbar?.addEventListener("mouseenter", () => {
    dot.classList.add("is-topbar");
    ring.classList.add("is-topbar");
  });

  topbar?.addEventListener("mouseleave", () => {
    dot.classList.remove("is-topbar");
    ring.classList.remove("is-topbar");
  });
}

/* ------------------------------------------------------------------ */
/* Route simulator — a continuously running flat mesh network.         */
/* Not a run-once demo: parcels spawn, bags seal, riders move, drop    */
/* and pick up along real point-to-point hops. Counts are conserved.   */
/* ------------------------------------------------------------------ */
const routeLab = document.querySelector<HTMLElement>(".route-lab");

if (routeLab) {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const VB_W = 1000;
  const VB_H = 620;
  const PAD = 11;
  const SPAN = 78;
  const KM_MIN = 2.5;
  const KM_MAX = 42.5;

  // Map real Nairobi-grid km coordinates (x=East, y=North) onto the stage.
  const kmToX = (km: number) => PAD + ((km - KM_MIN) / (KM_MAX - KM_MIN)) * SPAN;
  const kmToY = (km: number) => PAD + (1 - (km - KM_MIN) / (KM_MAX - KM_MIN)) * SPAN;
  const toSvgX = (p: number) => (p / 100) * VB_W;
  const toSvgY = (p: number) => (p / 100) * VB_H;

  const stage = routeLab.querySelector<HTMLElement>("[data-lab-stage]");
  const roadSvg = routeLab.querySelector<SVGSVGElement>(".lab-road-layer");
  const roadBase = roadSvg?.querySelector<SVGGElement>(".mesh-roads") || null;
  const roadFlow = roadSvg?.querySelector<SVGGElement>(".mesh-flows") || null;

  const eventEl = routeLab.querySelector<HTMLElement>("[data-lab-event]");
  const routeEl = routeLab.querySelector<HTMLElement>("[data-lab-route]");
  const priceEl = routeLab.querySelector<HTMLElement>("[data-lab-price]");
  const actionEl = routeLab.querySelector<HTMLElement>("[data-lab-action]");
  const ridersLiveEl = routeLab.querySelector<HTMLElement>("[data-lab-riders]");
  const deliveredEl = routeLab.querySelector<HTMLElement>("[data-lab-delivered]");
  const ledgerEl = routeLab.querySelector<HTMLElement>("[data-lab-ledger]");
  const demandInput = routeLab.querySelector<HTMLInputElement>("[data-lab-demand]");
  const demandCount = routeLab.querySelector<HTMLElement>("[data-lab-demand-count]");
  const shopInput = routeLab.querySelector<HTMLInputElement>("[data-lab-shops]");
  const shopCount = routeLab.querySelector<HTMLElement>("[data-lab-shop-count]");
  const courierInput = routeLab.querySelector<HTMLInputElement>("[data-lab-couriers]");
  const courierCount = routeLab.querySelector<HTMLElement>("[data-lab-courier-count]");
  const runButton = routeLab.querySelector<HTMLButtonElement>("[data-lab-run]");

  interface NetNode {
    id: string;
    el: HTMLElement;
    countEl: HTMLElement;
    kmX: number;
    kmY: number;
    left: number;
    top: number;
    svgX: number;
    svgY: number;
    inventory: number;
    active: boolean;
  }

  interface Edge {
    a: NetNode;
    b: NetNode;
    key: string;
    lenKm: number;
    base: SVGPathElement;
    flow: SVGPathElement;
    controlX: number | null;
    controlY: number | null;
  }

  interface Courier {
    id: string;
    el: HTMLElement;
    em: HTMLElement;
    carried: number;
    state: "idle" | "loading" | "moving" | "paused";
    path: NetNode[];
    leg: number;
    progress: number;
    speed: number;
    pauseUntil: number;
    heldAtPoint: number;
    laneX: number;
    laneY: number;
  }

  // Build nodes from the DOM. Each node carries its real km coordinates;
  // the rest (screen %, svg coords) is derived so roads and nodes always align.
  const nodeEls = Array.from(routeLab.querySelectorAll<HTMLElement>("[data-node]"));
  const nodes: NetNode[] = nodeEls.map((el) => {
    const kmX = Number(el.dataset.kmX);
    const kmY = Number(el.dataset.kmY);
    const left = kmToX(kmX);
    const top = kmToY(kmY);
    el.style.left = `${left}%`;
    el.style.top = `${top}%`;
    const countEl = el.querySelector<HTMLElement>("[data-node-count]")!;
    return {
      id: el.dataset.node || "?",
      el,
      countEl,
      kmX,
      kmY,
      left,
      top,
      svgX: toSvgX(left),
      svgY: toSvgY(top),
      inventory: 0,
      active: true,
    };
  });

  const shopOrder = ["P1", "P2", "P3", "P4", "P5", "P10", "P11", "P9", "P6", "P12", "P14", "P13", "P7", "P8"];
  const SHOP_MIN = 3;
  const SHOP_MAX = shopOrder.length;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const dist = (a: NetNode, b: NetNode) => Math.hypot(a.kmX - b.kmX, a.kmY - b.kmY);
  const activeNodes = () => nodes.filter((node) => node.active);

  // Build a curated road mesh. The grey base road and orange active overlay
  // share the exact same `d`, so active routes cannot drift beside the road.
  const edgeMap = new Map<string, Edge>();
  const curvedPath = (a: NetNode, b: NetNode, bend = 0) => {
    if (!bend) {
      return { d: `M ${a.svgX} ${a.svgY} L ${b.svgX} ${b.svgY}`, controlX: null, controlY: null };
    }

    const midX = (a.svgX + b.svgX) / 2;
    const midY = (a.svgY + b.svgY) / 2;
    const dx = b.svgX - a.svgX;
    const dy = b.svgY - a.svgY;
    const length = Math.max(1, Math.hypot(dx, dy));
    const controlX = midX + (-dy / length) * bend;
    const controlY = midY + (dx / length) * bend;

    return { d: `M ${a.svgX} ${a.svgY} Q ${controlX} ${controlY} ${b.svgX} ${b.svgY}`, controlX, controlY };
  };

  const addEdge = (a: NetNode, b: NetNode, bend = 0) => {
    if (a === b) return;
    const key = [a.id, b.id].sort().join("-");
    if (edgeMap.has(key) || !roadBase || !roadFlow) return;
    const { d, controlX, controlY } = curvedPath(a, b, bend);

    const base = document.createElementNS(SVG_NS, "path");
    base.setAttribute("d", d);
    base.classList.add("mesh-road");
    roadBase.appendChild(base);

    const flow = document.createElementNS(SVG_NS, "path");
    flow.setAttribute("d", d);
    flow.setAttribute("pathLength", "1");
    flow.classList.add("mesh-flow");
    roadFlow.appendChild(flow);

    edgeMap.set(key, { a, b, key, lenKm: dist(a, b), base, flow, controlX, controlY });
  };

  const roadPlan: Array<[string, string, number]> = [
    ["P2", "P4", -42],
    ["P4", "P6", 34],
    ["P6", "P8", -28],
    ["P2", "P1", 46],
    ["P2", "P10", -34],
    ["P10", "P1", 26],
    ["P10", "P4", 34],
    ["P1", "P3", -34],
    ["P1", "P11", 36],
    ["P11", "P3", -26],
    ["P3", "P5", 42],
    ["P1", "P5", -54],
    ["P11", "P5", 38],
    ["P4", "P5", -38],
    ["P5", "P12", -44],
    ["P5", "P9", 34],
    ["P12", "P3", 28],
    ["P12", "P7", -38],
    ["P6", "P9", -36],
    ["P6", "P14", 24],
    ["P14", "P9", -28],
    ["P14", "P8", 30],
    ["P14", "P5", 42],
    ["P9", "P8", 44],
    ["P9", "P13", 34],
    ["P13", "P7", -34],
    ["P13", "P8", 42],
    ["P9", "P7", -42],
    ["P5", "P7", 52],
  ];

  roadPlan.forEach(([from, to, bend]) => {
    const a = nodeById.get(from);
    const b = nodeById.get(to);
    if (a && b) {
      addEdge(a, b, bend);
    }
  });

  const edgeBetween = (a: NetNode, b: NetNode) => edgeMap.get([a.id, b.id].sort().join("-"));

  // Shortest path by km across the mesh (Dijkstra).
  const shortestPath = (start: NetNode, end: NetNode): NetNode[] => {
    if (!start.active || !end.active) return [];
    if (start === end) return [start];
    const graphNodes = activeNodes();
    const prev = new Map<string, NetNode | null>();
    const best = new Map<string, number>();
    graphNodes.forEach((n) => {
      best.set(n.id, Infinity);
      prev.set(n.id, null);
    });
    best.set(start.id, 0);
    const visited = new Set<string>();
    const queue = [start];
    while (queue.length) {
      queue.sort((a, b) => (best.get(a.id) ?? Infinity) - (best.get(b.id) ?? Infinity));
      const cur = queue.shift()!;
      if (visited.has(cur.id)) continue;
      visited.add(cur.id);
      if (cur === end) break;
      graphNodes.forEach((nb) => {
        const edge = edgeBetween(cur, nb);
        if (!edge || !edge.a.active || !edge.b.active) return;
        const candidate = edge.lenKm + (best.get(cur.id) ?? Infinity);
        if (candidate < (best.get(nb.id) ?? Infinity)) {
          best.set(nb.id, candidate);
          prev.set(nb.id, cur);
          queue.push(nb);
        }
      });
    }
    const path: NetNode[] = [];
    let cursorNode: NetNode | null = end;
    const pathGuard = new Set<string>();
    while (cursorNode && !pathGuard.has(cursorNode.id)) {
      pathGuard.add(cursorNode.id);
      path.unshift(cursorNode);
      cursorNode = prev.get(cursorNode.id) || null;
    }
    return path[0] === start ? path : [];
  };

  // 8-direction sector code from geographic angle (matches the spec).
  const sectorCode = (a: NetNode, b: NetNode) => {
    const dx = b.kmX - a.kmX;
    const dy = b.kmY - a.kmY;
    let angle = (Math.atan2(dx, dy) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    if (angle < 45) return 1;
    if (angle < 90) return 2;
    if (angle < 135) return 4;
    if (angle < 180) return 5;
    if (angle < 225) return 7;
    if (angle < 270) return 8;
    if (angle < 315) return 10;
    return 11;
  };

  const routeCode = (path: NetNode[]) =>
    path
      .slice(0, -1)
      .map((node, i) => sectorCode(node, path[i + 1]))
      .join(".");

  const riderLanes = [
    [0, 0],
    [10, -7],
    [-9, 8],
    [8, 9],
    [-11, -6],
    [12, 5],
  ];

  const couriers: Courier[] = Array.from(routeLab.querySelectorAll<HTMLElement>("[data-live-rider]")).map((el, i) => {
    const [laneX, laneY] = riderLanes[i % riderLanes.length];
    return {
      id: `R${i + 1}`,
      el,
      em: el.querySelector("em")!,
      carried: 0,
      state: "idle",
      path: [],
      leg: 0,
      progress: 0,
      speed: 0,
      pauseUntil: 0,
      heldAtPoint: 0,
      laneX,
      laneY,
    };
  });

  const resetCourier = (c: Courier) => {
    c.carried = 0;
    c.state = "idle";
    c.path = [];
    c.leg = 0;
    c.progress = 0;
    c.speed = 0;
    c.pauseUntil = 0;
    c.heldAtPoint = 0;
    c.em.textContent = "0";
    c.el.classList.remove("is-live", "is-express");
  };

  const setRiderPos = (c: Courier, left: number, top: number) => {
    const width = stage?.clientWidth || routeLab.clientWidth || 1;
    const height = stage?.clientHeight || routeLab.clientHeight || 1;
    const x = (left / 100) * width + c.laneX;
    const y = (top / 100) * height + c.laneY;
    c.el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  };

  const setRiderOnEdge = (c: Courier, edge: Edge, from: NetNode, progress: number) => {
    const directedProgress = edge.a === from ? progress : 1 - progress;
    const t = Math.max(0, Math.min(1, directedProgress));
    const inv = 1 - t;
    const x =
      edge.controlX === null
        ? edge.a.svgX + (edge.b.svgX - edge.a.svgX) * t
        : inv * inv * edge.a.svgX + 2 * inv * t * edge.controlX + t * t * edge.b.svgX;
    const y =
      edge.controlY === null
        ? edge.a.svgY + (edge.b.svgY - edge.a.svgY) * t
        : inv * inv * edge.a.svgY + 2 * inv * t * edge.controlY + t * t * edge.b.svgY;
    setRiderPos(c, (x / VB_W) * 100, (y / VB_H) * 100);
  };

  const updateNode = (n: NetNode) => {
    n.countEl.textContent = String(n.inventory);
    n.el.classList.toggle("has-bag", n.inventory > 0);
    n.el.classList.toggle("is-busy", n.inventory >= BAG_TAKE_MIN);
  };

  const pulseBag = (n: NetNode) => {
    if (reduceMotion) return;
    const bag = n.el.querySelector<HTMLElement>(".node-bag");
    if (!bag) return;
    bag.classList.remove("is-transfer");
    void bag.offsetWidth;
    bag.classList.add("is-transfer");
  };

  const showBagDelta = (node: NetNode, count: number, dir: "in" | "out") => {
    if (!stage || reduceMotion) return;
    const delta = document.createElement("span");
    delta.className = `bag-delta is-${dir}`;
    delta.textContent = `${dir === "in" ? "+" : "-"}${count}`;
    stage.appendChild(delta);

    const x = Math.min(91, Math.max(9, node.left + 7));
    const y = Math.min(90, Math.max(10, node.top - 5));
    gsap.set(delta, {
      left: `${x}%`,
      top: `${y}%`,
      xPercent: -50,
      yPercent: -50,
      opacity: 0,
      y: 4,
      scale: 0.86,
    });
    gsap
      .timeline()
      .to(delta, { opacity: 1, y: -2, scale: 1.04, duration: 0.16, ease: "power2.out" })
      .to(delta, { y: -8, scale: 0.98, duration: 0.34, ease: "power2.out" })
      .to(delta, { opacity: 0, y: -10, scale: 0.94, duration: 0.16, onComplete: () => delta.remove() }, "-=0.08");
  };

  let latestEvent = "Ready - press Run to start route simulator";
  let eventLockUntil = 0;
  const pushEvent = (msg: string) => {
    latestEvent = msg;
    eventLockUntil = performance.now() + 1700;
    if (eventEl) eventEl.textContent = msg;
    if (ledgerEl) ledgerEl.textContent = msg.split(" - ")[0].slice(0, 22);
  };

  const updateReadout = () => {
    const moving = couriers.filter((c) => c.state !== "idle").length;
    const enRoute = couriers.reduce((sum, c) => sum + c.carried, 0);
    const atPoints = activeNodes().reduce((sum, n) => sum + n.inventory, 0);
    if (routeEl) routeEl.textContent = `${atPoints} in point bags`;
    if (priceEl) priceEl.textContent = `${enRoute} in rider bags`;
    if (actionEl) actionEl.textContent = String(delivered);
    if (ridersLiveEl) ridersLiveEl.textContent = String(moving);
    if (deliveredEl) deliveredEl.textContent = String(delivered);
  };

  let roadSignature = "";
  const updateRoads = () => {
    const active = new Set<string>();

    couriers.forEach((c) => {
      if ((c.state === "moving" || c.state === "paused") && c.leg < c.path.length - 1) {
        const edge = edgeBetween(c.path[c.leg], c.path[c.leg + 1]);
        if (edge && edge.a.active && edge.b.active) {
          active.add(edge.key);
        }
      }
    });

    const nextSignature = Array.from(active).sort().join("|");

    if (nextSignature === roadSignature) return;
    roadSignature = nextSignature;

    edgeMap.forEach((edge) => {
      edge.flow.classList.toggle("is-busy", active.has(edge.key));
    });
  };

  const tryDispatch = () => {
    const idle = couriers.slice(0, activeCourierCount).filter((c) => c.state === "idle");
    if (!idle.length) return;
    const activeOrigins = new Set(
      couriers
        .filter((c) => c.state !== "idle" && c.path.length > 0)
        .map((c) => c.path[Math.min(c.leg, c.path.length - 1)].id),
    );
    const allCandidates = activeNodes().filter((n) => n.inventory >= BAG_TAKE_MIN);
    const candidates = allCandidates.filter((n) => !activeOrigins.has(n.id));
    const candidatePool = candidates.length ? candidates : allCandidates;
    if (!candidatePool.length) return;

    const origin = candidatePool.sort((a, b) => b.inventory - a.inventory)[0];
    const others = activeNodes().filter((n) => n !== origin);
    const destination = others[Math.floor(Math.random() * others.length)];
    const path = shortestPath(origin, destination);
    if (path.length < 2) return;

    const courier = idle[Math.floor(Math.random() * idle.length)];
    const take = Math.min(
      origin.inventory,
      BAG_TAKE_MIN + Math.floor(Math.random() * (BAG_TAKE_MAX - BAG_TAKE_MIN + 1)),
    );

    // Conservation: parcels leave the origin bag and ride with the courier.
    origin.inventory -= take;
    updateNode(origin);
    pulseBag(origin);

    courier.carried = take;
    courier.em.textContent = String(take);
    courier.path = path;
    courier.leg = 0;
    courier.progress = 0;
    courier.speed = 0.0005;
    courier.state = "loading";
    courier.heldAtPoint = 0;
    courier.el.classList.add("is-live");
    setRiderPos(courier, origin.left, origin.top);

    showBagDelta(origin, take, "out");
    pushEvent(`${courier.id} pickup sealed bag ${take} -> ${destination.id} - code ${routeCode(path)}`);
  };

  const spawnDemand = () => {
    let node: NetNode;
    if (focusNode && Math.random() < 0.4) {
      node = focusNode;
    } else {
      const available = activeNodes();
      node = available[Math.floor(Math.random() * available.length)];
    }
    const qty = 2 + Math.floor(Math.random() * 7);
    node.inventory += qty;
    updateNode(node);
    pulseBag(node);
    showBagDelta(node, qty, "in");
  };

  // ---- live state ----
  const BAG_TAKE_MIN = 10;
  const BAG_TAKE_MAX = 18;
  let demandValue = Number(demandInput?.value) || 8;
  let activeShopCount = Number(shopInput?.value) || 7;
  let activeCourierCount = Number(courierInput?.value) || 1;
  let paused = true;
  let hasStarted = false;
  let delivered = 0;
  let focusNode: NetNode | null = null;
  let labVisible = true;

  let lastTick = performance.now();
  let demandAcc = 0;
  let dispatchAcc = 0;
  let focusAcc = 0;
  let readoutAcc = 0;
  let rafId = 0;

  const frame = (now: number) => {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(80, now - lastTick);
    lastTick = now;
    if (paused || document.hidden || !labVisible) return;

    // Rotate the network "focus" to the busiest point — drives demand bias.
    focusAcc += dt;
    if (focusAcc > 6000) {
      focusAcc = 0;
      const available = activeNodes();
      const busy = available.filter((n) => n.inventory > 0).sort((a, b) => b.inventory - a.inventory);
      focusNode = busy[0] || available[Math.floor(Math.random() * available.length)];
      nodes.forEach((n) => n.el.classList.toggle("is-focus", n === focusNode));
    }

    // New senders drop parcels at points.
    demandAcc += dt;
    const spawnInterval = Math.max(260, 1500 - demandValue * 65);
    if (demandAcc >= spawnInterval) {
      demandAcc = 0;
      spawnDemand();
    }

    // Dispatch sealed bags to riders.
    dispatchAcc += dt;
    if (dispatchAcc >= 1100) {
      dispatchAcc = 0;
      tryDispatch();
    }

    // Move couriers hop by hop along their mesh route.
    for (const courier of couriers) {
      if (courier.state === "idle") continue;
      if (courier.state === "loading") courier.state = "moving";
      if (courier.state === "paused") {
        if (now >= courier.pauseUntil) {
          const here = courier.path[courier.leg];
          const reload = courier.heldAtPoint;
          if (reload > 0) {
            here.inventory = Math.max(0, here.inventory - reload);
            updateNode(here);
            pulseBag(here);
            showBagDelta(here, reload, "out");
            courier.carried = reload;
            courier.heldAtPoint = 0;
            courier.em.textContent = String(reload);
            pushEvent(`${courier.id} picked transfer bag ${reload} @ ${here.id}`);
          }
          courier.state = "moving";
        } else {
          continue;
        }
      }
      if (courier.state !== "moving") continue;

      courier.progress += courier.speed * dt;
      while (courier.progress >= 1 && courier.leg < courier.path.length - 1) {
        courier.progress -= 1;
        courier.leg += 1;
        const here = courier.path[courier.leg];
        setRiderPos(courier, here.left, here.top);

        if (courier.leg >= courier.path.length - 1) {
          // Final outtake: the bag enters the destination point and waits for pickup.
          const deliveredNow = courier.carried;
          here.inventory += deliveredNow;
          updateNode(here);
          pulseBag(here);
          delivered += deliveredNow;
          showBagDelta(here, deliveredNow, "in");
          pushEvent(`${courier.id} outtake ready ${deliveredNow} @ ${here.id}`);
          courier.carried = 0;
          courier.em.textContent = "0";
          courier.state = "idle";
          courier.path = [];
          courier.leg = 0;
          courier.progress = 0;
          courier.el.classList.remove("is-live", "is-express");
          break;
        }

        // Intermediate handoff: the sealed bag is put down, then picked up again.
        const handoff = courier.carried;
        here.inventory += handoff;
        updateNode(here);
        pulseBag(here);
        showBagDelta(here, handoff, "in");
        courier.carried = 0;
        courier.heldAtPoint = handoff;
        courier.em.textContent = "0";
        courier.state = "paused";
        courier.pauseUntil = now + 760;
        pushEvent(`${courier.id} transfer drop ${handoff} @ ${here.id}`);
        break;
      }

      if (courier.state === "moving" && courier.leg < courier.path.length - 1) {
        const from = courier.path[courier.leg];
        const to = courier.path[courier.leg + 1];
        const edge = edgeBetween(from, to);
        if (edge) {
          setRiderOnEdge(courier, edge, from, courier.progress);
        }
      }
    }

    updateRoads();

    readoutAcc += dt;
    if (readoutAcc > 120) {
      readoutAcc = 0;
      updateReadout();
    }
  };

  // ---- controls ----
  demandInput?.addEventListener("input", () => {
    demandValue = Math.max(2, Number(demandInput.value) || 2);
    if (demandCount) demandCount.textContent = String(demandValue);
    routeLab.style.setProperty("--demand-level", String((demandValue - 2) / 16));
  });

  const updateTopology = () => {
    const activeIds = new Set(shopOrder.slice(0, activeShopCount));

    nodes.forEach((node) => {
      node.active = activeIds.has(node.id);
      node.el.classList.toggle("is-offline", !node.active);
      node.el.classList.remove("is-focus");
      updateNode(node);
    });

    edgeMap.forEach((edge) => {
      const available = edge.a.active && edge.b.active;
      edge.base.classList.toggle("is-available", available);
      edge.flow.classList.toggle("is-available", available);
      if (!available) edge.flow.classList.remove("is-busy", "is-express");
    });

    couriers.forEach((courier) => {
      if (courier.state !== "idle" && courier.path.some((node) => !node.active)) {
        resetCourier(courier);
      }
    });

    focusNode = null;
    roadSignature = "";
    updateRoads();
    updateReadout();
  };

  const updateCouriers = () => {
    couriers.forEach((courier, index) => {
      const enabled = index < activeCourierCount;
      courier.el.classList.toggle("is-disabled", !enabled);
      if (!enabled) resetCourier(courier);
    });
    updateRoads();
    updateReadout();
  };

  shopInput?.addEventListener("input", () => {
    activeShopCount = Math.max(SHOP_MIN, Math.min(SHOP_MAX, Number(shopInput.value) || SHOP_MIN));
    if (shopCount) shopCount.textContent = String(activeShopCount);
    routeLab.style.setProperty("--shop-level", String((activeShopCount - SHOP_MIN) / (SHOP_MAX - SHOP_MIN)));
    updateTopology();
    pushEvent(`${activeShopCount} shops online - roads reconnected`);
    if (!paused) {
      spawnDemand();
      tryDispatch();
    }
  });

  courierInput?.addEventListener("input", () => {
    activeCourierCount = Math.max(1, Math.min(couriers.length, Number(courierInput.value) || 1));
    if (courierCount) courierCount.textContent = String(activeCourierCount);
    routeLab.style.setProperty("--courier-level", String((activeCourierCount - 1) / Math.max(1, couriers.length - 1)));
    updateCouriers();
    pushEvent(`${activeCourierCount} riders available - dispatch pool updated`);
    if (!paused) {
      for (let i = 0; i < activeCourierCount; i++) {
        tryDispatch();
      }
    }
  });

  runButton?.addEventListener("click", () => {
    paused = !paused;
    if (runButton) {
      runButton.textContent = paused ? "Resume" : "Pause";
      runButton.setAttribute("aria-pressed", String(!paused));
    }
    routeLab.classList.toggle("is-paused", paused);
    if (!paused) {
      lastTick = performance.now();
      if (!hasStarted) {
        hasStarted = true;
        pushEvent("Live mesh started - first rider accepting bag");
        for (let i = 0; i < activeCourierCount; i++) {
          tryDispatch();
        }
      } else {
        pushEvent("Live mesh resumed - riders continue route");
      }
    } else {
      pushEvent("Live mesh paused - route state held");
    }
  });

  const presetBtns = Array.from(routeLab.querySelectorAll<HTMLButtonElement>("[data-lab-preset]"));
  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      presetBtns.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      const count = Math.max(SHOP_MIN, Math.min(SHOP_MAX, Number(btn.dataset.labPreset) || SHOP_MIN));
      if (shopInput) shopInput.value = String(count);
      activeShopCount = count;
      if (shopCount) shopCount.textContent = String(count);
      routeLab.style.setProperty("--shop-level", String((count - SHOP_MIN) / (SHOP_MAX - SHOP_MIN)));
      updateTopology();
      pushEvent(count === 3 ? "Preset: 3-Hub Nairobi Pilot (P1, P2, P3)" : `Preset: ${count} simulated hubs online`);
      if (!paused) {
        spawnDemand();
        tryDispatch();
      }
    });
  });

  // ---- init ----
  nodes.forEach((n) => {
    n.inventory = 6 + Math.floor(Math.random() * 11);
    updateNode(n);
  });

  if (demandCount) demandCount.textContent = String(demandValue);
  if (shopCount) shopCount.textContent = String(activeShopCount);
  if (courierCount) courierCount.textContent = String(activeCourierCount);
  routeLab.classList.add("is-paused");
  routeLab.style.setProperty("--demand-level", String((demandValue - 2) / 16));
  routeLab.style.setProperty("--shop-level", String((activeShopCount - SHOP_MIN) / (SHOP_MAX - SHOP_MIN)));
  routeLab.style.setProperty("--courier-level", String((activeCourierCount - 1) / Math.max(1, couriers.length - 1)));
  updateTopology();
  updateCouriers();
  if (eventEl) eventEl.textContent = latestEvent;
  if (ledgerEl) ledgerEl.textContent = "ready";
  updateReadout();
  routeLab.classList.remove("is-booting");

  const observer = new IntersectionObserver(
    ([entry]) => {
      labVisible = entry ? entry.isIntersecting : true;
      if (labVisible) lastTick = performance.now();
    },
    { threshold: 0.08 },
  );
  observer.observe(routeLab);

  if (!reduceMotion) {
    rafId = requestAnimationFrame(frame);
  } else {
    // Even with reduced motion, keep a slow trickle so the panel never looks dead.
    const slow = () => {
      spawnDemand();
      tryDispatch();
      updateReadout();
      window.setTimeout(slow, 2600);
    };
    window.setTimeout(slow, 1200);
  }
}

if (!reduceMotion) {
  const hero = document.querySelector<HTMLElement>(".hero");
  const heroWords = gsap.utils.toArray<HTMLElement>("[data-hero-word]");
  const shopWords = heroWords.slice(0, 2);
  const riderWords = heroWords.slice(2);
  const routeLinePaths = gsap.utils
    .toArray<SVGPathElement>(".hero-route-base, .hero-route-active")
    .filter((path) => getComputedStyle(path).display !== "none");

  const prepareRouteLine = () => {
    routeLinePaths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, {
        autoAlpha: path.classList.contains("hero-route-active") ? 0.7 : 1,
        strokeDasharray: length,
        strokeDashoffset: length,
      });
    });
  };

  gsap
    .timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => hero?.classList.add("is-route-live"),
    })
    .to(".hero-copy > .eyebrow", {
      autoAlpha: 1,
      y: 0,
      duration: 0.24,
    }, 0)
    .to(
      shopWords,
      {
        autoAlpha: 1,
        yPercent: 0,
        y: 0,
        duration: 0.42,
        stagger: 0.045,
      },
      0.08,
    )
    .to(
      riderWords,
      {
        autoAlpha: 1,
        yPercent: 0,
        y: 0,
        duration: 0.44,
        stagger: 0.045,
      },
      0.26,
    )
    .to(
      ".hero-lede",
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.34,
      },
      0.48,
    )
    .to("[data-topbar]", {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.34,
      ease: "power2.out",
    }, 0.54)
    .to(".hero-visual", {
      autoAlpha: 1,
      filter: "blur(0px)",
      duration: 0.44,
      ease: "power2.out",
    }, 0.6)
    .to(
      ".hero-actions",
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.3,
      },
      0.68,
    )
    .to(".hero-route-node.is-rider", {
      autoAlpha: 1,
      scale: 1,
      duration: 0.2,
      ease: "back.out(1.9)",
    }, 0.92)
    .to(
      ".hero-flow",
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.3,
      },
      0.78,
    )
    .to(".hero-route-node.is-bag", {
      autoAlpha: 1,
      scale: 1,
      duration: 0.2,
      ease: "back.out(1.9)",
    }, 1.18)
    .to(".hero-route-node.is-shop", {
      autoAlpha: 1,
      scale: 1,
      duration: 0.2,
      ease: "back.out(1.9)",
    }, 1.44)
    .add(prepareRouteLine, 1.7)
    .to(routeLinePaths, {
      strokeDashoffset: 0,
      duration: 0.58,
      ease: "power2.out",
    }, 1.7)
    .add(() => {
      hero?.classList.add("is-route-line-visible");
      gsap.set(routeLinePaths, { clearProps: "strokeDasharray,strokeDashoffset,opacity,visibility" });
      hero?.classList.add("is-route-live");
    }, 2.28)
    .to(
      ".hero-strip",
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.3,
      },
      0.96,
    );

  const revealTargets = (
    trigger: HTMLElement,
    targets: ArrayLike<HTMLElement> | Iterable<HTMLElement>,
    options: gsap.TweenVars = {},
  ) => {
    const targetArray = Array.from(targets).filter((target) => getComputedStyle(target).display !== "none");
    if (!targetArray.length) return;

    const {
      clearProps = "opacity,visibility,transform,filter",
      duration = 0.72,
      ease = "power3.out",
      filter = "blur(8px)",
      scrollTrigger,
      stagger = targetArray.length > 1 ? 0.075 : 0,
      y = 26,
      ...tweenOptions
    } = options;
    const scrollTriggerOptions = typeof scrollTrigger === "object" ? scrollTrigger : {};
    const {
      onEnter: providedOnEnter,
      onRefresh: providedOnRefresh,
      ...triggerOptions
    } = scrollTriggerOptions;
    const fromFilter = typeof filter === "string" ? filter : "blur(8px)";
    const fromY = typeof y === "number" || typeof y === "string" ? y : 26;
    let hasPlayed = false;
    let fallbackFrame = 0;

    const cleanupFallback = () => {
      window.removeEventListener("scroll", queueFallback);
      window.removeEventListener("resize", queueFallback);
      if (fallbackFrame) {
        window.cancelAnimationFrame(fallbackFrame);
        fallbackFrame = 0;
      }
    };

    const play = () => {
      if (hasPlayed) return;
      hasPlayed = true;
      cleanupFallback();
      gsap.to(targetArray, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration,
        ease,
        stagger,
        clearProps,
        ...tweenOptions,
      });
    };

    const checkFallback = () => {
      if (hasPlayed) return;
      const rect = trigger.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.94 || rect.bottom <= window.innerHeight * 0.94) {
        play();
      }
    };

    function queueFallback() {
      if (fallbackFrame) return;
      fallbackFrame = window.requestAnimationFrame(() => {
        fallbackFrame = 0;
        checkFallback();
      });
    }

    gsap.set(targetArray, {
      autoAlpha: 0,
      y: fromY,
      filter: fromFilter,
    });

    ScrollTrigger.create({
      trigger,
      start: "top 84%",
      once: true,
      ...triggerOptions,
      onEnter: (self) => {
        if (typeof providedOnEnter === "function") providedOnEnter(self);
        play();
      },
      onRefresh: (self) => {
        if (typeof providedOnRefresh === "function") providedOnRefresh(self);
        if (self.isActive || self.progress > 0) checkFallback();
      },
    });

    window.addEventListener("scroll", queueFallback, { passive: true });
    window.addEventListener("resize", queueFallback, { passive: true });
    window.setTimeout(queueFallback, 250);
    window.setTimeout(queueFallback, 1400);
  };

  const revealElement = (element: HTMLElement, options: gsap.TweenVars = {}) => {
    revealTargets(element, [element], {
      y: 28,
      duration: 0.78,
      scrollTrigger: { start: "top 86%" },
      ...options,
    });
  };

  document.querySelectorAll<HTMLElement>(".reveal").forEach((element) => {
    if (element.classList.contains("section-heading") || element.classList.contains("concept-copy")) {
      revealTargets(element, element.children as HTMLCollectionOf<HTMLElement>, { y: 22 });
      return;
    }

    if (element.classList.contains("route-system-inner")) {
      revealTargets(element, element.querySelectorAll<HTMLElement>(".route-system-heading, .route-lab"));
      return;
    }

    if (element.classList.contains("economics-board")) {
      revealTargets(element, element.querySelectorAll<HTMLElement>(".quote-lock-panel, .market-console, .audit-ledger-panel"));
      return;
    }

    if (element.classList.contains("pilot-system")) {
      revealTargets(element, element.querySelectorAll<HTMLElement>(".pilot-console, .pilot-control-panel"));
      return;
    }

    if (element.classList.contains("lead-panel")) {
      revealTargets(element, element.querySelectorAll<HTMLElement>(".lead-copy, .lead-form"));
      return;
    }

    revealElement(element);
  });

  const storyPin = document.querySelector<HTMLElement>(".story-pin");
  if (storyPin) {
    revealTargets(storyPin, storyPin.querySelectorAll<HTMLElement>(".flow-device, .story-copy"), {
      y: 32,
      scrollTrigger: { start: "top 78%" },
    });
  }

  const scaleSection = document.querySelector<HTMLElement>(".scale-section");
  if (scaleSection) {
    revealTargets(
      scaleSection,
      scaleSection.querySelectorAll<HTMLElement>(".scale-heading > div, .scale-check-grid article, .scale-cycle-panel, .scale-rules-panel"),
      {
        y: 30,
        duration: 0.74,
        stagger: 0.08,
        scrollTrigger: { start: "top 76%" },
      },
    );

    const scaleSignalStrip = scaleSection.querySelector<HTMLElement>(".scale-signal-strip");
    if (scaleSignalStrip) {
      revealTargets(scaleSignalStrip, scaleSignalStrip.querySelectorAll<HTMLElement>(":scope > div"), {
        y: 18,
        duration: 0.58,
        stagger: 0.06,
        scrollTrigger: { start: "top 84%" },
      });
    }
  }

  const nestedRevealGroups = [
    {
      trigger: ".route-lab",
      targets: ".lab-stage, .lab-controls, .lab-readout",
      start: "top 78%",
      y: 18,
    },
    {
      trigger: ".quote-lock-panel",
      targets: ".quote-breakdown > div, .quote-rules span",
      start: "top 78%",
      y: 14,
    },
    {
      trigger: ".market-console",
      targets: ".market-clearing > div, .market-rider",
      start: "top 78%",
      y: 14,
    },
    {
      trigger: ".audit-ledger-panel",
      targets: ".audit-ledger-grid > div",
      start: "top 82%",
      y: 14,
    },
    {
      trigger: ".pilot-console",
      targets: ".pilot-point, .pilot-console-foot > div",
      start: "top 78%",
      y: 16,
    },
    {
      trigger: ".pilot-control-panel",
      targets: ".pilot-tabs > button, .pilot-signal-grid > div",
      start: "top 78%",
      y: 16,
    },
    {
      trigger: ".lead-panel",
      targets: ".lead-switch > button, .lead-summary > div, .lead-form label, .lead-form-field, .lead-form .button",
      start: "top 80%",
      y: 16,
    },
  ];

  nestedRevealGroups.forEach(({ trigger, targets, start, y }) => {
    const triggerElement = document.querySelector<HTMLElement>(trigger);
    if (!triggerElement) return;
    revealTargets(triggerElement, triggerElement.querySelectorAll<HTMLElement>(targets), {
      y,
      duration: 0.58,
      scrollTrigger: { start },
    });
  });

  const footer = document.querySelector<HTMLElement>(".site-footer");
  if (footer) {
    revealTargets(
      footer,
      footer.querySelectorAll<HTMLElement>(".footer-brand, .footer-signal > div, .footer-column, .footer-contact, .footer-bottom"),
      { y: 20, scrollTrigger: { start: "top 88%" } },
    );
  }

  const concept = document.querySelector<HTMLElement>(".concept-pin");
  const projectCarousel = document.querySelector<HTMLElement>(".project-carousel");
  const projectTrack = document.querySelector<HTMLElement>("[data-project-track]");
  const projectCards = Array.from(document.querySelectorAll<HTMLElement>("[data-project-stage]"));
  const projectMarkers = Array.from(document.querySelectorAll<HTMLElement>("[data-project-marker]"));
  const projectCurrent = document.querySelector<HTMLElement>("[data-project-current]");

  if (concept && projectCarousel && projectTrack && projectCards.length) {
    let activeProjectIndex = -1;

    const setProjectProgress = (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      const position = clamped * (projectCards.length - 1);
      const index = Math.min(projectCards.length - 1, Math.round(position));

      concept.style.setProperty("--project-progress", String(clamped));
      if (projectCurrent) projectCurrent.textContent = String(index + 1).padStart(2, "0");

      if (activeProjectIndex === index) return;
      activeProjectIndex = index;

      projectCards.forEach((card, cardIndex) => {
        card.classList.toggle("is-active", cardIndex === index);
      });
      projectMarkers.forEach((marker, markerIndex) => marker.classList.toggle("is-active", markerIndex === index));

      gsap.to(projectTrack, {
        xPercent: -100 * index,
        duration: 0.42,
        ease: "power3.out",
        overwrite: true,
      });
    };

    const media = gsap.matchMedia();
    media.add("(min-width: 901px)", () => {
      setProjectProgress(0);
      const trigger = ScrollTrigger.create({
        trigger: concept,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.55,
        invalidateOnRefresh: true,
        onUpdate: (self) => setProjectProgress(self.progress),
        onRefresh: (self) => setProjectProgress(self.progress),
      });

      return () => {
        trigger.kill();
        activeProjectIndex = -1;
        gsap.set(projectTrack, { clearProps: "transform" });
      };
    });

    media.add("(max-width: 900px)", () => {
      setProjectProgress(0);
      const trigger = ScrollTrigger.create({
        trigger: concept,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.45,
        invalidateOnRefresh: true,
        onUpdate: (self) => setProjectProgress(self.progress),
        onRefresh: (self) => setProjectProgress(self.progress),
      });

      return () => {
        trigger.kill();
        activeProjectIndex = -1;
        gsap.set(projectTrack, { clearProps: "transform" });
      };
    });
  }

  const story = document.querySelector<HTMLElement>(".story-pin");
  const stage = document.querySelector<HTMLElement>(".flow-device");
  const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-story-step]"));
  const flowBidRows = Array.from(document.querySelectorAll<HTMLElement>(".flow-bid-row"));
  const flowBoard = document.querySelector<HTMLElement>(".flow-board");
  const flowStateEls = {
    headLabel: document.querySelector<HTMLElement>("[data-flow-head-label]"),
    code: document.querySelector<HTMLElement>("[data-flow-code]"),
    kicker: document.querySelector<HTMLElement>("[data-flow-kicker]"),
    main: document.querySelector<HTMLElement>("[data-flow-main]"),
    sub: document.querySelector<HTMLElement>("[data-flow-sub]"),
    detailLabel: document.querySelector<HTMLElement>("[data-flow-detail-label]"),
    detail: document.querySelector<HTMLElement>("[data-flow-detail]"),
    marketTitle: document.querySelector<HTMLElement>("[data-flow-market-title]"),
    decisionTitle: document.querySelector<HTMLElement>("[data-flow-decision-title]"),
    decisionNote: document.querySelector<HTMLElement>("[data-flow-decision-note]"),
    tag0: document.querySelector<HTMLElement>("[data-flow-tag-0]"),
    tag1: document.querySelector<HTMLElement>("[data-flow-tag-1]"),
    tag2: document.querySelector<HTMLElement>("[data-flow-tag-2]"),
    visualTitle: document.querySelector<HTMLElement>("[data-flow-visual-title]"),
    visualKicker: document.querySelector<HTMLElement>("[data-flow-visual-kicker]"),
    visualNote: document.querySelector<HTMLElement>("[data-flow-visual-note]"),
    packetLabel: document.querySelector<HTMLElement>("[data-flow-packet-label]"),
    cardRoute: document.querySelector<HTMLElement>("[data-flow-card-route]"),
    cardBundle: document.querySelector<HTMLElement>("[data-flow-card-bundle]"),
    cardOutcome: document.querySelector<HTMLElement>("[data-flow-card-outcome]"),
    statusLabel: document.querySelector<HTMLElement>("[data-flow-status-label]"),
    statusMain: document.querySelector<HTMLElement>("[data-flow-status-main]"),
    statusNote: document.querySelector<HTMLElement>("[data-flow-status-note]"),
    bidRider0: document.querySelector<HTMLElement>("[data-flow-bid-rider-0]"),
    bidValue0: document.querySelector<HTMLElement>("[data-flow-bid-value-0]"),
    bidState0: document.querySelector<HTMLElement>("[data-flow-bid-state-0]"),
    bidRider1: document.querySelector<HTMLElement>("[data-flow-bid-rider-1]"),
    bidValue1: document.querySelector<HTMLElement>("[data-flow-bid-value-1]"),
    bidState1: document.querySelector<HTMLElement>("[data-flow-bid-state-1]"),
    bidRider2: document.querySelector<HTMLElement>("[data-flow-bid-rider-2]"),
    bidValue2: document.querySelector<HTMLElement>("[data-flow-bid-value-2]"),
    bidState2: document.querySelector<HTMLElement>("[data-flow-bid-state-2]"),
  };

  if (story && stage && steps.length) {
    const flowStates = [
      {
        key: "code",
        headLabel: "4-character code marked with pen",
        code: "Code X92K",
        kicker: "Parcel Code",
        main: "X92K",
        sub: "assigned to local corridor sector",
        detailLabel: "Routing",
        detail: "App maps X92K to transit sector 4.4.5 for directional sorting.",
        marketTitle: "Pre-Transit",
        decisionTitle: "Code serves as deterministic routing tag",
        decisionNote: "Shop staff writes brief code with marker; system instantly assigns target corridor sector.",
        visualTitle: "Write 4 characters with marker",
        visualKicker: "Hub Counter",
        visualNote: "Parcel receives code before entering directional transit bag.",
        packetLabel: "Code",
        cardRoute: "sector 4.4.5",
        cardBundle: "not yet sealed",
        cardOutcome: "quote locked",
        statusLabel: "Hub Intake",
        statusMain: "X92K marked",
        statusNote: "sort to sector bag",
        tags: ["Zero printers", "Zero smartphone GPS", "Offline-ready"],
        bids: [
          ["Code", "X92K marker written", "ready"],
          ["Sort", "next hub checks sector", "queued"],
          ["Price", "sender quote is fixed", "locked"],
        ],
        selectedBid: 0,
      },
      {
        key: "bag",
        headLabel: "Sealed directional transit bag",
        code: "Bag 4",
        kicker: "Transit Bag",
        main: "Bag 4",
        sub: "6 parcels heading along the same corridor",
        detailLabel: "Rule",
        detail: "Bag stays sealed until the next node switches corridor direction.",
        marketTitle: "Bag Handling",
        decisionTitle: "Keep Bag 4 sealed in transit",
        decisionNote: "Hub forwards entire directional bag rather than handling individual parcels.",
        visualTitle: "Seal directional transit bag",
        visualKicker: "Bag 4",
        visualNote: "Parcels sharing a route travel as a single sealed cargo unit.",
        packetLabel: "Bag 4",
        cardRoute: "corridor 4",
        cardBundle: "6 sealed parcels",
        cardOutcome: "ready for dispatch",
        statusLabel: "Sealed Bag",
        statusMain: "Bag 4 / 6 pcs",
        statusNote: "open only on route switch",
        tags: ["6 parcels", "Corridor 4", "Max 8 bags"],
        bids: [
          ["Bag 4", "6 parcels travel together", "sealed"],
          ["Counter", "staff scans only bag tag", "instant"],
          ["Split", "open only on corridor change", "hold"],
        ],
        selectedBid: 0,
      },
      {
        key: "bid",
        headLabel: "Dynamic motorcycle carrier matching",
        code: "Rider R2",
        kicker: "Carrier Exchange",
        main: "R2",
        sub: "already traveling across sector 4",
        detailLabel: "Why R2",
        detail: "System matches riders already traversing this corridor, designed to reduce empty return trips.",
        marketTitle: "Transit Dispatch",
        decisionTitle: "Assign R2 to reduce empty miles",
        decisionNote: "R2 is already traversing sector 4, utilizing existing urban movement vectors.",
        visualTitle: "Match rider's natural path",
        visualKicker: "Carrier Exchange",
        visualNote: "Selected carrier is already heading in the destination direction.",
        packetLabel: "R2",
        cardRoute: "same sector",
        cardBundle: "bag remains sealed",
        cardOutcome: "lowest marginal cost",
        statusLabel: "Rider Match",
        statusMain: "R2 on active corridor",
        statusNote: "zero detour transit",
        tags: ["Same sector", "Immediate pickup", "Low marginal cost"],
        bids: [
          ["R2", "same sector, on the road", "500 KES / bag"],
          ["R5", "nearby, requires detour", "standby 550 KES"],
          ["R1", "requires empty return leg", "rejected 680 KES"],
        ],
        selectedBid: 0,
      },
      {
        key: "audit",
        headLabel: "Fixed sender quote, fully audited balance",
        code: "Ledger",
        kicker: "Route Ledger",
        main: "100 KES",
        sub: "customer quote remains locked upon intake",
        detailLabel: "Record",
        detail: "Tracking events, hub commissions, rider payout, and network margin settle hop by hop.",
        marketTitle: "Settlement",
        decisionTitle: "Commit to internal ledger",
        decisionNote: "The hub uses its VKES balance to fund transit. Hubs and riders receive verified ledger allocations upon handover.",
        visualTitle: "Handover audit",
        visualKicker: "Financial Ledger",
        visualNote: "Rate, hub commission, rider payout, and surplus are verified on COMMIT.",
        packetLabel: "Ledger",
        cardRoute: "transit settled",
        cardBundle: "15 KES hub commission",
        cardOutcome: "R2 payout audited",
        statusLabel: "Settlement",
        statusMain: "100 KES locked quote",
        statusNote: "payout released",
        tags: ["100 KES rate", "15 KES hub commission", "Event-based payout"],
        bids: [
          ["Sender", "fixed customer price", "100 KES"],
          ["Intake", "hub intake commission", "15 KES"],
          ["Rider", "carrier payout on ledger", "audited"],
        ],
        selectedBid: 2,
      },
    ];

    let activeStoryIndex = -1;
    let flowSwitchTimer: number | undefined;
    const compactFlow = window.matchMedia("(max-width: 760px)");
    const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
    const smoothStep = (start: number, end: number, value: number) => {
      const t = clamp01((value - start) / (end - start));
      return t * t * (3 - 2 * t);
    };

    const setStoryClasses = (index: number) => {
      steps.forEach((step, stepIndex) => step.classList.toggle("is-active", stepIndex === index));
    };

    const setFlowSheet = (
      sheet: "one" | "two" | "three",
      reveal: number,
      desktopY: number,
      mobileY: number,
      desktopScale: number,
      mobileScale: number,
      desktopRotate: number,
      mobileRotate: number,
    ) => {
      const compact = compactFlow.matches;
      const y = (compact ? mobileY : desktopY) * reveal;
      const scale = 1 - (1 - (compact ? mobileScale : desktopScale)) * reveal;
      const rotate = (compact ? mobileRotate : desktopRotate) * reveal;

      stage.style.setProperty(`--flow-sheet-${sheet}-opacity`, reveal.toFixed(3));
      stage.style.setProperty(`--flow-sheet-${sheet}-y`, `${y.toFixed(2)}px`);
      stage.style.setProperty(`--flow-sheet-${sheet}-scale`, scale.toFixed(4));
      stage.style.setProperty(`--flow-sheet-${sheet}-rotate`, `${rotate.toFixed(3)}deg`);
    };

    const triggerFlowSwitch = () => {
      if (!flowBoard || reduceMotion) return;
      flowBoard.classList.remove("is-flow-switching");
      void flowBoard.offsetWidth;
      flowBoard.classList.add("is-flow-switching");
      if (flowSwitchTimer) window.clearTimeout(flowSwitchTimer);
      flowSwitchTimer = window.setTimeout(() => flowBoard.classList.remove("is-flow-switching"), 560);
    };

    const writeFlowState = (index: number) => {
      const state = flowStates[index] || flowStates[0];
      flowBoard?.setAttribute("data-flow-state", state.key);
      if (flowStateEls.headLabel) flowStateEls.headLabel.textContent = state.headLabel;
      if (flowStateEls.code) flowStateEls.code.textContent = state.code;
      if (flowStateEls.kicker) flowStateEls.kicker.textContent = state.kicker;
      if (flowStateEls.main) flowStateEls.main.textContent = state.main;
      if (flowStateEls.sub) flowStateEls.sub.textContent = state.sub;
      if (flowStateEls.detailLabel) flowStateEls.detailLabel.textContent = state.detailLabel;
      if (flowStateEls.detail) flowStateEls.detail.textContent = state.detail;
      if (flowStateEls.marketTitle) flowStateEls.marketTitle.textContent = state.marketTitle;
      if (flowStateEls.decisionTitle) flowStateEls.decisionTitle.textContent = state.decisionTitle;
      if (flowStateEls.decisionNote) flowStateEls.decisionNote.textContent = state.decisionNote;
      if (flowStateEls.visualTitle) flowStateEls.visualTitle.textContent = state.visualTitle;
      if (flowStateEls.visualKicker) flowStateEls.visualKicker.textContent = state.visualKicker;
      if (flowStateEls.visualNote) flowStateEls.visualNote.textContent = state.visualNote;
      if (flowStateEls.packetLabel) flowStateEls.packetLabel.textContent = state.packetLabel;
      if (flowStateEls.cardRoute) flowStateEls.cardRoute.textContent = state.cardRoute;
      if (flowStateEls.cardBundle) flowStateEls.cardBundle.textContent = state.cardBundle;
      if (flowStateEls.cardOutcome) flowStateEls.cardOutcome.textContent = state.cardOutcome;
      if (flowStateEls.statusLabel) flowStateEls.statusLabel.textContent = state.statusLabel;
      if (flowStateEls.statusMain) flowStateEls.statusMain.textContent = state.statusMain;
      if (flowStateEls.statusNote) flowStateEls.statusNote.textContent = state.statusNote;
      [flowStateEls.tag0, flowStateEls.tag1, flowStateEls.tag2].forEach((tag, tagIndex) => {
        if (tag) tag.textContent = state.tags[tagIndex];
      });
      const bidTargets = [
        [flowStateEls.bidRider0, flowStateEls.bidValue0, flowStateEls.bidState0],
        [flowStateEls.bidRider1, flowStateEls.bidValue1, flowStateEls.bidState1],
        [flowStateEls.bidRider2, flowStateEls.bidValue2, flowStateEls.bidState2],
      ];
      bidTargets.forEach(([rider, value, bidState], bidIndex) => {
        if (rider) rider.textContent = state.bids[bidIndex][0];
        if (value) value.textContent = state.bids[bidIndex][1];
        if (bidState) bidState.textContent = state.bids[bidIndex][2];
      });
      flowBidRows.forEach((row, rowIndex) => row.classList.toggle("is-selected", rowIndex === state.selectedBid));
    };

    const setStoryProgress = (progress: number) => {
      const index = Math.min(steps.length - 1, Math.floor(progress * steps.length));
      const previousIndex = activeStoryIndex;
      if (index !== previousIndex) {
        activeStoryIndex = index;
        setStoryClasses(index);
        writeFlowState(index);
        triggerFlowSwitch();
      }
      const clampedProgress = Math.max(0.08, progress);
      const sheetOne = smoothStep(0.18, 0.32, clampedProgress);
      const sheetTwo = smoothStep(0.43, 0.57, clampedProgress);
      const sheetThree = smoothStep(0.68, 0.82, clampedProgress);

      stage.style.setProperty("--flow-progress", `${clampedProgress}`);
      stage.style.setProperty("--flow-card-drop", "0px");
      stage.style.setProperty("--flow-card-rotate", "0deg");
      const compactLandscapeStack = window.matchMedia(
        "(min-width: 901px) and (max-width: 1180px) and (orientation: landscape), (min-width: 1181px) and (max-width: 1380px) and (orientation: landscape) and (max-height: 899px)",
      ).matches;
      const stackSpread = compactLandscapeStack ? 0.66 : 1;
      const stackTilt = compactLandscapeStack ? 0.72 : 1;

      setFlowSheet("one", sheetOne, 12 * stackSpread, 12 * stackSpread, 0.984, 0.982, -0.22 * stackTilt, -0.2 * stackTilt);
      setFlowSheet("two", sheetTwo, 24 * stackSpread, 24 * stackSpread, 0.962, 0.964, 0.16 * stackTilt, 0.14 * stackTilt);
      setFlowSheet("three", sheetThree, 36 * stackSpread, 34 * stackSpread, 0.94, 0.946, -0.1 * stackTilt, -0.08 * stackTilt);
    };

    setStoryClasses(0);
    writeFlowState(0);
    activeStoryIndex = 0;
    setStoryProgress(0);

    const media = gsap.matchMedia();
    media.add("(min-width: 901px)", () => {
      const trigger = ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => setStoryProgress(self.progress),
        onRefresh: (self) => setStoryProgress(self.progress),
      });

      return () => trigger.kill();
    });
	    media.add("(min-width: 761px) and (max-width: 900px)", () => {
	      const trigger = ScrollTrigger.create({
	        trigger: story,
	        start: "top top",
	        end: "bottom bottom",
	        scrub: 0.45,
	        invalidateOnRefresh: true,
	        onUpdate: (self) => setStoryProgress(self.progress),
	        onRefresh: (self) => setStoryProgress(self.progress),
	      });

      return () => trigger.kill();
    });

    media.add("(max-width: 760px)", () => {
      const trigger = ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.45,
        invalidateOnRefresh: true,
        onUpdate: (self) => setStoryProgress(self.progress),
        onRefresh: (self) => setStoryProgress(self.progress),
      });

      return () => trigger.kill();
    });
  }

  gsap.to(".ambient-sheen", {
    xPercent: -6,
    yPercent: 4,
    duration: 7,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

const pilotSystem = document.querySelector<HTMLElement>("[data-pilot-system]");

if (pilotSystem) {
  const pilotTabs = Array.from(pilotSystem.querySelectorAll<HTMLButtonElement>("[data-pilot-tab]"));
  const pilotPoints = Array.from(pilotSystem.querySelectorAll<HTMLButtonElement>("[data-pilot-point]"));
  const pilotMap = pilotSystem.querySelector<HTMLElement>(".pilot-map-panel");
  const pilotTitle = pilotSystem.querySelector<HTMLElement>("[data-pilot-title]");
  const pilotCopy = pilotSystem.querySelector<HTMLElement>("[data-pilot-copy]");
  const pilotWindow = pilotSystem.querySelector<HTMLElement>("[data-pilot-window]");
  const pilotTarget = pilotSystem.querySelector<HTMLElement>("[data-pilot-target]");
  const pilotMeasure = pilotSystem.querySelector<HTMLElement>("[data-pilot-measure]");
  const pilotGate = pilotSystem.querySelector<HTMLElement>("[data-pilot-gate]");
  const pilotRiderLabel = pilotSystem.querySelector<HTMLElement>("[data-pilot-rider-label]");

  const pilotStates = [
    {
      title: "Launch First Merchant Cluster",
      copy: "We begin with a compact cluster of verified partner shops close enough for bags to cycle with minimal transfer friction.",
      window: "Gate 01",
      target: "hub cluster",
      measure: "first outtake",
      gate: "zero warehouses",
      progress: 0,
      markerX: "12.5%",
      stepIndex: 0,
      rider: "R0",
    },
    {
      title: "Test Directional Bag Sorting",
      copy: "Shops sort shipments into a maximum of 8 transit bags. Bags are unsealed only when corridor route changes.",
      window: "Gate 02",
      target: "8 corridors",
      measure: "sorting precision",
      gate: "ledger balance",
      progress: 0.333,
      markerX: "37.5%",
      stepIndex: 1,
      rider: "B4",
    },
    {
      title: "Freight Exchange for Private Carriers",
      copy: "Private motorcycle taxi operators waiting at stands pick up ready bags along their natural route, designed to reduce empty return trips.",
      window: "Gate 03",
      target: "sealed bags",
      measure: "transit speed",
      gate: "rider R2",
      progress: 0.667,
      markerX: "62.5%",
      stepIndex: 2,
      rider: "R2",
    },
    {
      title: "Full Ledger Audit Before Scale",
      copy: "Every hop, hub commission, rider payout, and network surplus are validated in the ledger before expanding the corridor.",
      window: "Gate 04",
      target: "zero variance",
      measure: "ledger audit",
      gate: "scale readiness",
      progress: 1,
      markerX: "87.5%",
      stepIndex: 3,
      rider: "OK",
    },
  ];

  const setPilotState = (index: number) => {
    const state = pilotStates[index] || pilotStates[0];
    pilotTabs.forEach((tab, tabIndex) => tab.classList.toggle("is-active", tabIndex === index));
    pilotPoints.forEach((point, pointIndex) => point.classList.toggle("is-active", pointIndex === index));
    pilotMap?.style.setProperty("--pilot-progress", String(state.progress));
    pilotMap?.style.setProperty("--pilot-marker-x", state.markerX);
    pilotMap?.style.setProperty("--pilot-index", String(state.stepIndex));
    if (pilotTitle) pilotTitle.textContent = state.title;
    if (pilotCopy) pilotCopy.textContent = state.copy;
    if (pilotWindow) pilotWindow.textContent = state.window;
    if (pilotTarget) pilotTarget.textContent = state.target;
    if (pilotMeasure) pilotMeasure.textContent = state.measure;
    if (pilotGate) pilotGate.textContent = state.gate;
    if (pilotRiderLabel) pilotRiderLabel.textContent = state.rider;
  };

  pilotTabs.forEach((tab) => {
    tab.addEventListener("click", () => setPilotState(Number(tab.dataset.pilotTab || 0)));
  });
  pilotPoints.forEach((point) => {
    point.addEventListener("click", () => setPilotState(Number(point.dataset.pilotPoint || 0)));
  });
  setPilotState(0);
}

const leadForm = document.querySelector<HTMLFormElement>("#lead-form");
const status = document.querySelector<HTMLElement>("[data-lead-status]");
const leadPanel = document.querySelector<HTMLElement>("[data-lead-panel]");
const leadSuccess = document.querySelector<HTMLElement>("[data-lead-success]");
const leadSuccessKicker = document.querySelector<HTMLElement>("[data-lead-success-kicker]");
const leadSuccessTitle = document.querySelector<HTMLElement>("[data-lead-success-title]");
const leadSuccessCopy = document.querySelector<HTMLElement>("[data-lead-success-copy]");
const leadReset = document.querySelector<HTMLButtonElement>("[data-lead-reset]");

const leadConfigs = {
  investor: {
    audience: "Investor",
    title: "Request the PPTT Investor Deck & Corridor Plan.",
    copy: "Contact us to receive the pilot corridor rollout strategy, Unit Economics, and Pre-Seed parameters (£175k).",
    lane: "Investor Deck",
    reply: "deck + pre-seed terms",
    typeLabel: "Investor Profile",
    messageLabel: "What materials would you like to receive?",
    placeholder: "Corridor rollout plan, Unit Economics, Pre-Seed syndicate terms...",
    submit: "Request Investor Deck",
    subject: "PPTT Investor Inquiry",
    options: ["Angel Investor", "Venture Capital / PE", "Strategic Corporate", "Advisory / Operator"],
  },
  shop: {
    audience: "Shop",
    title: "Become a PPTT Partner Hub.",
    copy: "Local shop and business owners earn extra income handling parcel intake, directional bags, and cash exchange with zero upfront capital.",
    lane: "Hub Application",
    reply: "merchant terms",
    typeLabel: "Business Type",
    messageLabel: "Tell us about your business:",
    placeholder: "Location, business type, daily operating hours...",
    submit: "Apply as Partner Hub",
    subject: "PPTT Shop Application",
    options: ["Grocery / Convenience", "Restaurant / Café", "Pharmacy", "Retail / Service Kiosk"],
  },
  rider: {
    audience: "Rider",
    title: "Join the PPTT Carrier Network.",
    copy: "Earn steady income transporting sealed bags along your existing daily urban travel routes, designed to reduce empty mileage.",
    lane: "Carrier Network",
    reply: "carrier registration",
    typeLabel: "Vehicle / Profile",
    messageLabel: "Which corridors or zones do you ride?",
    placeholder: "Neighborhoods, motorcycle model, availability...",
    submit: "Register as Carrier",
    subject: "PPTT Rider Registration",
    options: ["Motorcycle Taxi (Boda)", "Urban Cyclist", "Courier Fleet", "Fleet Dispatcher"],
  },
  partner: {
    audience: "Partner",
    title: "Municipal, Payment & Infrastructure Partnerships.",
    copy: "Explore collaborations in mobile money integrations, Cash-In/Cash-Out networks, municipal transport, or regional corridors.",
    lane: "Strategic Partnership",
    reply: "partnership team",
    typeLabel: "Partner Category",
    messageLabel: "What is your proposal?",
    placeholder: "Mobile money, API integrations, urban logistics, retail chain...",
    submit: "Connect With Us",
    subject: "PPTT Strategic Partnership",
    options: ["Operational Partner", "Fintech / Mobile Wallets", "Municipal Authority", "Retail Chain"],
  },
};

let activeLeadKey: keyof typeof leadConfigs = "investor";

const setLeadFormBusy = (isBusy: boolean) => {
  if (!leadForm) return;
  leadForm.classList.toggle("is-sending", isBusy);
  leadForm.setAttribute("aria-busy", String(isBusy));
  leadForm
    .querySelectorAll("input, textarea, select, button")
    .forEach((control) => {
      (control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement).disabled = isBusy;
    });
};

const resetLeadFeedback = () => {
  if (!leadForm) return;
  leadForm.classList.remove("is-sending", "is-success");
  leadForm.removeAttribute("aria-busy");
  leadSuccess?.setAttribute("hidden", "");
  if (status) status.textContent = "";
  setLeadFormBusy(false);
};

if (leadPanel && leadForm) {
  const leadChoices = Array.from(leadPanel.querySelectorAll<HTMLButtonElement>("[data-lead-choice]"));
  const leadTitle = leadPanel.querySelector<HTMLElement>("[data-lead-title]");
  const leadCopy = leadPanel.querySelector<HTMLElement>("[data-lead-copy]");
  const leadLane = leadPanel.querySelector<HTMLElement>("[data-lead-lane]");
  const leadReply = leadPanel.querySelector<HTMLElement>("[data-lead-reply]");
  const leadAudience = leadPanel.querySelector<HTMLInputElement>("[data-lead-audience]");
  const leadType = leadPanel.querySelector<HTMLSelectElement>("[data-lead-type]");
  const leadSelect = leadPanel.querySelector<HTMLElement>("[data-lead-select]");
  const leadSelectTrigger = leadPanel.querySelector<HTMLButtonElement>("[data-lead-select-trigger]");
  const leadSelectValue = leadPanel.querySelector<HTMLElement>("[data-lead-select-value]");
  const leadSelectMenu = leadPanel.querySelector<HTMLElement>("[data-lead-select-menu]");
  const leadTypeLabel = leadPanel.querySelector<HTMLElement>("[data-lead-type-label]");
  const leadMessageLabel = leadPanel.querySelector<HTMLElement>("[data-lead-message-label]");
  const leadMessage = leadPanel.querySelector<HTMLTextAreaElement>("[data-lead-message]");
  const leadSubmit = leadPanel.querySelector<HTMLButtonElement>("[data-lead-submit]");

  const closeLeadSelect = () => {
    leadSelect?.classList.remove("is-open");
    leadSelectTrigger?.setAttribute("aria-expanded", "false");
  };

  const setLeadTypeValue = (value: string) => {
    if (leadType) leadType.value = value;
    if (leadSelectValue) leadSelectValue.textContent = value || "Select one";
    leadSelect?.classList.toggle("has-value", Boolean(value));
    leadSelect?.classList.remove("has-error");
    leadSelectMenu
      ?.querySelectorAll<HTMLButtonElement>("[data-lead-select-option]")
      .forEach((option) => {
        const selected = option.dataset.leadSelectOption === value;
        option.classList.toggle("is-selected", selected);
        option.setAttribute("aria-selected", String(selected));
      });
  };

  const renderLeadTypeOptions = (options: string[]) => {
    if (leadType) {
      leadType.replaceChildren(new Option("Select one", ""), ...options.map((option) => new Option(option, option)));
    }

    if (leadSelectMenu) {
      leadSelectMenu.replaceChildren();
      options.forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "lead-select-option";
        button.dataset.leadSelectOption = option;
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", "false");
        button.textContent = option;
        button.addEventListener("click", () => {
          setLeadTypeValue(option);
          closeLeadSelect();
          leadSelectTrigger?.focus();
        });
        leadSelectMenu.append(button);
      });
    }

    setLeadTypeValue("");
  };

  const setLead = (key: keyof typeof leadConfigs) => {
    const config = leadConfigs[key];
    activeLeadKey = key;
    resetLeadFeedback();
    leadChoices.forEach((choice) => choice.classList.toggle("is-active", choice.dataset.leadChoice === key));
    if (leadTitle) leadTitle.textContent = config.title;
    if (leadCopy) leadCopy.textContent = config.copy;
    if (leadLane) leadLane.textContent = config.lane;
    if (leadReply) leadReply.textContent = config.reply;
    if (leadAudience) leadAudience.value = config.audience;
    renderLeadTypeOptions(config.options);
    if (leadTypeLabel) leadTypeLabel.textContent = config.typeLabel;
    if (leadMessageLabel) leadMessageLabel.textContent = config.messageLabel;
    if (leadMessage) leadMessage.placeholder = config.placeholder;
    if (leadSubmit) leadSubmit.textContent = config.submit;
  };

  leadChoices.forEach((choice) => {
    choice.addEventListener("click", () => {
      const key = (choice.dataset.leadChoice || "investor") as keyof typeof leadConfigs;
      setLead(key);
    });
  });

  leadSelectTrigger?.addEventListener("click", () => {
    const isOpen = leadSelect?.classList.contains("is-open");
    if (isOpen) {
      closeLeadSelect();
      return;
    }
    leadSelect?.classList.add("is-open");
    leadSelectTrigger.setAttribute("aria-expanded", "true");
  });

  leadSelectTrigger?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLeadSelect();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      leadSelect?.classList.add("is-open");
      leadSelectTrigger.setAttribute("aria-expanded", "true");
      leadSelectMenu?.querySelector<HTMLButtonElement>("[data-lead-select-option]")?.focus();
    }
  });

  leadSelectMenu?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLeadSelect();
      leadSelectTrigger?.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!leadSelect?.contains(event.target as Node)) closeLeadSelect();
  });

  setLead("investor");
}

if (leadForm && status) {
  leadReset?.addEventListener("click", () => {
    const key = activeLeadKey;
    leadForm.reset();
    resetLeadFeedback();
    leadPanel?.querySelector<HTMLInputElement>("input[name='name']")?.focus();
    if (leadPanel && leadForm) {
      const activeChoice = leadPanel.querySelector<HTMLButtonElement>(`[data-lead-choice="${key}"]`);
      activeChoice?.click();
    }
  });

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (leadForm.classList.contains("is-sending")) return;
    if (!leadForm.checkValidity()) {
      leadForm.reportValidity();
      return;
    }

    const data = new FormData(leadForm);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const type = String(data.get("type") || "");
    const audience = String(data.get("audience") || leadConfigs[activeLeadKey].audience);
    const message = String(data.get("message") || "");
    const website = String(data.get("website") || "");
    const config = leadConfigs[activeLeadKey];

    if (!type) {
      status.textContent = "Choose a lead type before sending.";
      leadPanel?.querySelector<HTMLElement>("[data-lead-select]")?.classList.add("has-error");
      leadPanel?.querySelector<HTMLButtonElement>("[data-lead-select-trigger]")?.focus();
      return;
    }

    const endpoint = leadForm.getAttribute("action") || "/api/lead";
    const payload = {
      audience,
      email,
      message,
      name,
      page: window.location.href,
      subject: config.subject,
      submittedAt: new Date().toISOString(),
      type,
      website,
    };

    setLeadFormBusy(true);
    status.textContent = "Sending request...";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result: { error?: string; message?: string } | null = null;
      try {
        result = (await response.json()) as { error?: string; message?: string };
      } catch {
        result = null;
      }

      if (!response.ok) {
        // Fallback: direct client-side delivery to FormSubmit
        const directResponse = await fetch("https://formsubmit.co/ajax/pptt_vercel@outlook.com", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            _subject: `[PPTT] ${audience} inquiry: ${name}`,
            _replyto: email,
            _captcha: "false",
            Audience: audience,
            Type: type,
            Name: name,
            Email: email,
            SubmittedAt: payload.submittedAt,
            Page: payload.page,
            Message: message || "No message provided.",
          }),
        });

        const directText = await directResponse.text();
        let directResult: { success?: string | boolean; message?: string } | null = null;
        try {
          directResult = JSON.parse(directText) as { success?: string | boolean; message?: string };
        } catch {
          directResult = null;
        }

        if (!directResponse.ok || (directResult && directResult.success === "false")) {
          throw new Error(directResult?.message || result?.error || "Could not send the request.");
        }
      }

      setLeadFormBusy(false);
      leadSuccessKicker && (leadSuccessKicker.textContent = `${audience} request sent`);
      leadSuccessTitle && (leadSuccessTitle.textContent = "Request sent.");
      leadSuccessCopy && (leadSuccessCopy.textContent = `We will reply with ${config.reply}.`);
      status.textContent = "Request sent.";
      leadSuccess?.removeAttribute("hidden");
      leadForm.classList.add("is-success");
      leadSuccess?.focus({ preventScroll: true });
    } catch (error) {
      setLeadFormBusy(false);
      const fallback = "Could not send yet. Please email pptt_vercel@outlook.com directly.";
      status.textContent = error instanceof Error ? error.message || fallback : fallback;
    }
  });
}
