/** @jsxRuntime classic */
import React, { useEffect, useState } from "react";

const scaleSteps = [
  {
    code: "01",
    title: "Dodawaj punkty tam, gdzie skracają drogę",
    body: "Otwieraj kolejny sklep partnerski tam, gdzie zagęszcza to siatkę, zwiększa wypełnienie worków i ułatwia transfer motocyklistom.",
    metric: "bramka klastra",
  },
  {
    code: "02",
    title: "Mierz gęstość, nie powierzchnię",
    body: "Obszar jest dojrzały, gdy worki kierunkowe i kursy motocykli powtarzają się płynnie i bezobsługowo bez ręcznej dyspozycji.",
    metric: "3+ worki na linię",
  },
  {
    code: "03",
    title: "Odsuń w czasie stały czynsz",
    body: "Budowa stałego magazynu jest zbędna – sieć sklepów i motocykli jest tańsza, bardziej elastyczna i odporna na zatory miejskie.",
    metric: "zero stałego czynszu",
  },
];

const scaleSignals = [
  ["Gęstość hubów", "klaster testowy", "przed stałym czynszem"],
  ["Wypełnienie worków", "bramka skali", "minimum do spięcia korytarza"],
  ["Ruch motocykli", "naturalny potok", "kursy w istniejących kierunkach"],
  ["Stałe magazyny", "niepotrzebne", "decydują realne dane z tras"],
];

const scaleChecks = [
  ["Otwórz punkt", "Tylko tam, gdzie skraca dystans i tworzy pewne połączenie między hubami."],
  ["Lekkie punkty", "Zero drukarek, zero pracowników magazynowych, wystarczy wolna półka i lada."],
  ["Dane decydują", "Skalowanie następuje organicznie na podstawie rzeczywistych przepływów worków."],
];

const cycleNodes = [
  {
    key: "shop",
    label: "Hub",
    title: "Lokalny sklep staje się hubem",
    body: "Właściciel przyjmuje paczkę, wpisuje 4-znakowy kod i wkłada do odpowiedniego worka kierunkowego.",
    stat: "klaster hubów",
    x: "50%",
    y: "13.3%",
  },
  {
    key: "bag",
    label: "Worek",
    title: "Maksymalnie 8 worków kierunkowych",
    body: "Zapieczętowany worek gromadzi paczki jadące w tym samym kierunku. Worek pozostaje zamknięty w drodze.",
    stat: "8 kierunków",
    x: "84.8%",
    y: "37.1%",
  },
  {
    key: "rider",
    label: "Motocykl",
    title: "Prywatni przewoźnicy (Moto-taxi)",
    body: "Kierowcy boda-boda czekający na postojach podejmują zapieczętowane worki, minimalizując puste przejazdy powrotne.",
    stat: "giełda kursów",
    x: "71.9%",
    y: "80%",
  },
  {
    key: "ledger",
    label: "Księga",
    title: "Księga rozlicza transfery paczki",
    body: "Paczka płaci za swój transfer w wirtualnej walucie. Punkty i kierowcy otrzymują środki natychmiast.",
    stat: "audyt salda",
    x: "28.1%",
    y: "80%",
  },
  {
    key: "candidate",
    label: "P5",
    title: "Organiczny punkt P5",
    body: "Nowy punkt włącza się organicznie, gdy sąsiedni sklep osiąga maksymalną przepustowość.",
    stat: "płaska sieć",
    x: "15.2%",
    y: "37.1%",
  },
];

const compareRows = [
  ["Kapitał (CAPEX)", "Dodanie kolejnego sklepu", "Wynajem i budowa sortowni"],
  ["Weryfikacja", "Realny obrót worków", "Prognozy na papierze"],
  ["Ryzyko operacyjne", "Elastyczny punkt partnerski", "Ciężar stałego czynszu"],
  ["Zarządzanie siecią", "Automatyczna księga zdarzeń", "Ręczna dyspozytornia"],
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
            <p className="eyebrow">Logika skalowania</p>
            <h2 id="proof-title">Skalowanie siecią sklepów zamiast budowy sortowni.</h2>
          </div>
          <div className="scale-heading-copy">
            <p>
              Sieć rośnie organicznie wraz z liczbą paczek. Sklepy przejmują przyjęcie i proste sortowanie do worków,
              a motocykle obsługują transfery bez konieczności inwestowania w kosztowną infrastrukturę magazynową.
            </p>
            <div className="scale-heading-decision">
              <span>Bieżący etap</span>
              <strong>Dołącz punkt P5, wstrzymaj budowę sortowni</strong>
            </div>
          </div>
        </div>

        <div className="scale-check-grid" aria-label="Kryteria operacyjne skalowania">
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
              <span>Rozwój oparty o mikroskopijne huby</span>
              <strong>Zero stałych magazynów</strong>
            </div>
            <div className="scale-cycle-layout" aria-label="Cykl rozwoju hubów">
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
                  <span>Siatka PPTT</span>
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
                  <strong>Status bramki</strong>
                  <em>{activeCycle.key === "candidate" ? "dołącz P5 po ustabilizowaniu korytarza" : "buduj gęstość sieci"}</em>
                </div>
              </div>
            </div>
            <div className="scale-compare">
              <div className="scale-compare-head">
                <span>Porównanie modeli</span>
                <strong>PPTT vs Tradycyjna sortownia</strong>
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
              <span>Kryteria wzrostu</span>
              <strong>Weryfikowalne</strong>
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
              <span>Decyzja o infrastrukturze</span>
              <div>
                <strong>Dołączaj kolejne sklepy</strong>
                <p>Zero czynszu, lokalni przedsiębiorcy, natychmiastowe skalowanie bez ryzyka.</p>
              </div>
              <div>
                <strong>Unikaj budowy sortowni</strong>
                <p>Sortownie centralne tworzą wąskie gardła i generują ogromne koszty stałe na rynkach bez adresacji.</p>
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

