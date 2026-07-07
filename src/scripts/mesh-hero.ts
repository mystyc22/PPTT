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
    const isTopbarControl = Boolean(element.closest(".topbar"));

    element.addEventListener("mouseenter", () => {
      if (!isTopbarControl) ring.classList.add("is-active");
    });
    element.addEventListener("mouseleave", () => ring.classList.remove("is-active"));
  });

  topbar?.addEventListener("mouseenter", () => {
    dot.classList.add("is-hidden");
    ring.classList.add("is-hidden");
  });

  topbar?.addEventListener("mouseleave", () => {
    dot.classList.remove("is-hidden");
    ring.classList.remove("is-hidden");
  });
}

/* ------------------------------------------------------------------ */
/* Live route system — a continuously running flat mesh network.       */
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
  const SHOP_MIN = 5;
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

  let latestEvent = "Ready - press Run to start live mesh";
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
  const heroWords = gsap.utils.toArray<HTMLElement>("[data-hero-word]");
  const heroAfterWords = gsap.utils.toArray<HTMLElement>(".hero-copy > .eyebrow, .hero-lede, .hero-actions");

  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    .to(heroWords, {
      autoAlpha: 1,
      yPercent: 0,
      y: 0,
      duration: 0.58,
      stagger: 0.13,
    })
    .to(
      heroAfterWords,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.58,
        stagger: 0.08,
      },
      "-=0.04",
    )
    .to(
      ".hero-strip",
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
      },
      "-=0.34",
    );

  document.querySelectorAll<HTMLElement>(".reveal").forEach((element) => {
    gsap.from(element, {
      y: 28,
      duration: 0.8,
      ease: "power3.out",
      clearProps: "transform",
      scrollTrigger: {
        trigger: element,
        start: "top 86%",
        once: true,
      },
    });
  });

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
        headLabel: "Marker-written direction code",
        code: "Code 4.4.5",
        kicker: "Direction code",
        main: "4.4.5",
        sub: "relative sectors, not a GPS address",
        detailLabel: "Meaning",
        detail: "4 -> 4 -> 5 means each next shop only reads its local direction.",
        marketTitle: "Before auction",
        decisionTitle: "Code becomes the routing instruction",
        decisionNote: "The parcel does not need an address lookup. Each shop only reads the next local sector.",
        visualTitle: "Write local code",
        visualKicker: "Shop counter",
        visualNote: "Parcel gets a code before any route auction starts.",
        packetLabel: "Code",
        cardRoute: "4.4.5 local sectors",
        cardBundle: "not sealed yet",
        cardOutcome: "quote locked",
        statusLabel: "Counter proof",
        statusMain: "4.4.5 written",
        statusNote: "sort next sector",
        tags: ["No printer", "No GPS", "Offline ready"],
        bids: [
          ["Code", "4.4.5 written by marker", "ready"],
          ["Sort", "next shop reads local sector", "offline"],
          ["Quote", "sender price is fixed", "locked"],
        ],
        selectedBid: 0,
      },
      {
        key: "bag",
        headLabel: "Sealed direction bag",
        code: "Bag 4",
        kicker: "Direction bag",
        main: "Bag 4",
        sub: "6 parcels moving in the same sector",
        detailLabel: "Rule",
        detail: "Do not open the bag unless the next point changes the code.",
        marketTitle: "Bag handling",
        decisionTitle: "Keep Bag 4 sealed",
        decisionNote: "The shop moves the whole direction bag forward instead of touching every parcel again.",
        visualTitle: "Seal direction bag",
        visualKicker: "Bag 4",
        visualNote: "Six same-direction parcels travel as one sealed unit.",
        packetLabel: "Bag 4",
        cardRoute: "direction 4",
        cardBundle: "6 sealed parcels",
        cardOutcome: "auction ready",
        statusLabel: "Sealed unit",
        statusMain: "Bag 4 / 6",
        statusNote: "open on split",
        tags: ["6 parcels", "Direction 4", "Open on code change"],
        bids: [
          ["Bag 4", "six parcels stay together", "sealed"],
          ["Counter", "staff checks only the bag code", "fast"],
          ["Split", "only when next code changes", "hold"],
        ],
        selectedBid: 0,
      },
      {
        key: "bid",
        headLabel: "Dynamic rider auction",
        code: "R2 assigned",
        kicker: "Rider market",
        main: "R2",
        sub: "already moving in sector 4",
        detailLabel: "Why R2",
        detail: "The system prefers a rider already going that way before starting a new trip.",
        marketTitle: "Rider assignment",
        decisionTitle: "Assign R2, avoid a fresh route",
        decisionNote: "R2 is already moving through sector 4, so the network pays for an existing direction of travel.",
        visualTitle: "Match rider movement",
        visualKicker: "Courier market",
        visualNote: "The winning rider is already crossing the sector.",
        packetLabel: "R2",
        cardRoute: "same sector",
        cardBundle: "bag stays closed",
        cardOutcome: "fresh route avoided",
        statusLabel: "Courier match",
        statusMain: "R2 same sector",
        statusNote: "no fresh route",
        tags: ["Same sector", "Ready now", "Lower network cost"],
        bids: [
          ["R2", "same sector, already moving", "assign 280"],
          ["R5", "nearby but adds a detour", "backup 310"],
          ["R1", "new route would be started", "reject 360"],
        ],
        selectedBid: 0,
      },
      {
        key: "audit",
        headLabel: "Fixed quote, audited payout",
        code: "Ledger",
        kicker: "Route ledger",
        main: "300 KES",
        sub: "sender quote stays fixed after drop-off",
        detailLabel: "Logged",
        detail: "Scan, handling reserve, rider payout, and skip-hop reward stay traceable.",
        marketTitle: "Settlement",
        decisionTitle: "Write the settlement ledger",
        decisionNote: "The sender quote stays fixed while the internal courier payout is audited.",
        visualTitle: "Audit handoff",
        visualKicker: "Ledger",
        visualNote: "Quote, reserve, payout, and skip-hop reward are logged.",
        packetLabel: "Audit",
        cardRoute: "handoff logged",
        cardBundle: "50 KES reserve",
        cardOutcome: "R2 payout audited",
        statusLabel: "Settlement",
        statusMain: "300 KES fixed",
        statusNote: "payout logged",
        tags: ["300 KES fixed", "50 KES reserve", "Payout logged"],
        bids: [
          ["Sender", "paid quote does not change", "300 KES"],
          ["Reserve", "shop handling fee stays visible", "50 KES"],
          ["Rider", "auction payout and reward logged", "audit"],
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
      setFlowSheet("one", sheetOne, 12, 12, 0.984, 0.982, -0.22, -0.2);
      setFlowSheet("two", sheetTwo, 24, 24, 0.962, 0.964, 0.16, 0.14);
      setFlowSheet("three", sheetThree, 36, 34, 0.94, 0.946, -0.1, -0.08);
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
        end: () => `+=${Math.max(window.innerHeight * 2.55, steps.length * 360)}`,
        pin: true,
        scrub: 0.45,
        anticipatePin: 1,
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
      title: "Recruit a tight shop ring",
      copy: "Start with 5-8 trusted points close enough for sealed bags to move without a central warehouse.",
      window: "Week 01",
      target: "5-8 points",
      measure: "first pickup",
      gate: "no depot needed",
      progress: 0,
      markerX: "12.5%",
      stepIndex: 0,
      rider: "R0",
    },
    {
      title: "Prove sealed bag sorting",
      copy: "Staff sort parcels into direction bags and only open a bag when the next local code changes.",
      window: "Week 02",
      target: "8 directions",
      measure: "bag accuracy",
      gate: "counts conserved",
      progress: 0.333,
      markerX: "37.5%",
      stepIndex: 1,
      rider: "B4",
    },
    {
      title: "Let riders bid on live demand",
      copy: "Riders see ready bundles. The system prefers a rider already moving through the same sector.",
      window: "Week 03",
      target: "live bags",
      measure: "time to move",
      gate: "R2 assigned",
      progress: 0.667,
      markerX: "62.5%",
      stepIndex: 2,
      rider: "R2",
    },
    {
      title: "Audit the corridor before scaling",
      copy: "Every handoff, handling reserve, payout, and surplus event is checked before adding more points.",
      window: "Week 04",
      target: "zero diffs",
      measure: "ledger audit",
      gate: "scale ready",
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
const status = document.querySelector<HTMLElement>(".form-status");
const leadPanel = document.querySelector<HTMLElement>("[data-lead-panel]");

const leadConfigs = {
  investor: {
    audience: "Investor",
    title: "Choose the right BebaRun conversation.",
    copy: "Investors can request the deck, pilot economics, and route ledger model for the first corridor.",
    lane: "Investor deck",
    reply: "deck + pilot economics",
    typeLabel: "Investor type",
    messageLabel: "What should we send?",
    placeholder: "Deck, pilot model, technical appendix...",
    submit: "Prepare investor request",
    subject: "BebaRun investor lead",
    options: ["Angel investor", "VC / fund", "Strategic investor", "Operator / advisor"],
  },
  shop: {
    audience: "Shop",
    title: "Turn a shop into a local courier point.",
    copy: "Shop owners can ask about intake, sealed direction bags, staff workflow, and handling economics.",
    lane: "Shop pilot",
    reply: "shop workflow",
    typeLabel: "Shop profile",
    messageLabel: "What kind of point could you run?",
    placeholder: "Location, daily parcel volume, staff availability...",
    submit: "Prepare shop request",
    subject: "BebaRun shop pilot lead",
    options: ["Convenience shop", "Restaurant", "Pharmacy", "Service counter"],
  },
  rider: {
    audience: "Rider",
    title: "Join the rider side of the market.",
    copy: "Riders can register interest for live bag assignments, corridor coverage, and payout rules.",
    lane: "Rider market",
    reply: "rider onboarding",
    typeLabel: "Rider setup",
    messageLabel: "Where do you usually ride?",
    placeholder: "Neighborhoods, vehicle type, working hours...",
    submit: "Prepare rider request",
    subject: "BebaRun rider lead",
    options: ["Motorbike rider", "Bicycle rider", "Courier team", "Dispatcher"],
  },
  partner: {
    audience: "Partner",
    title: "Discuss operations, wallets, or corridor partnerships.",
    copy: "Operators and strategic partners can ask about implementation, compliance, wallets, or city rollout.",
    lane: "Partner route",
    reply: "partnership brief",
    typeLabel: "Partner type",
    messageLabel: "What should we discuss?",
    placeholder: "Operations, wallets, compliance, city rollout...",
    submit: "Prepare partner request",
    subject: "BebaRun partner lead",
    options: ["Operations partner", "Wallet / payments", "City partner", "Brand / merchant network"],
  },
};

let activeLeadKey: keyof typeof leadConfigs = "investor";

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
  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(leadForm);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const type = String(data.get("type") || "");
    const audience = String(data.get("audience") || leadConfigs[activeLeadKey].audience);
    const message = String(data.get("message") || "");
    const config = leadConfigs[activeLeadKey];

    if (!type) {
      status.textContent = "Choose a lead type before sending.";
      leadPanel?.querySelector<HTMLElement>("[data-lead-select]")?.classList.add("has-error");
      leadPanel?.querySelector<HTMLButtonElement>("[data-lead-select-trigger]")?.focus();
      return;
    }

    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Lead lane: ${audience}`,
      `Lead type: ${type}`,
      "",
      `Request: ${message || config.placeholder}`,
    ].join("\n");

    status.textContent = "Opening your email client with the request.";
    window.location.href = `mailto:hello@bebarun.com?subject=${encodeURIComponent(config.subject)}&body=${encodeURIComponent(body)}`;
  });
}
