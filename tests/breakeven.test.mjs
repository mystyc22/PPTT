/**
 * PPTT Break-Even Financial Model — Regression Tests
 * Run: node tests/breakeven.test.mjs
 *
 * Reference table (from investor brief):
 * | Shipments/day | Monthly revenue | Monthly result  |
 * | 25            | 15,000 KES      | -155,000 KES    |
 * | 100           | 60,000 KES      | -110,000 KES    |
 * | 200           | 120,000 KES     | -50,000 KES     |
 * | 284           | 170,400 KES     | +400 KES        |
 */

function monthlyRevenue(spd, grossAlloc, opDays) {
  return spd * grossAlloc * opDays;
}

function monthlyResult(spd, grossAlloc, varCost, fixedKES, opDays) {
  const contribution = grossAlloc - varCost;
  return spd * opDays * contribution - fixedKES;
}

function breakEvenPerDay(fixedKES, grossAlloc, varCost, opDays) {
  const contribution = grossAlloc - varCost;
  if (contribution <= 0) return Infinity;
  return Math.ceil(fixedKES / contribution / opDays);
}

// Illustrative assumptions
const G = 20;        // gross allocation KES/parcel
const V = 0;         // variable platform cost KES/parcel
const FX = 170;      // KES per GBP
const GBP = 1000;    // monthly fixed OPEX
const DAYS = 30;
const FIXED = GBP * FX; // 170,000 KES

let pass = 0, fail = 0;
const log = [];

function eq(label, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  log.push((ok ? "  PASS" : "  FAIL") + "  " + label + ": got " + actual + (ok ? "" : " (expected " + expected + ")"));
}

function inf(label, actual) {
  const ok = !isFinite(actual);
  ok ? pass++ : fail++;
  log.push((ok ? "  PASS" : "  FAIL") + "  " + label + ": " + (ok ? "Infinity" : "expected Infinity, got " + actual));
}

// Reference table
eq("A (25/day) revenue",       monthlyRevenue(25,  G, DAYS),                15000);
eq("A (25/day) result",        monthlyResult(25,   G, V, FIXED, DAYS),      -155000);
eq("B (100/day) revenue",      monthlyRevenue(100, G, DAYS),                60000);
eq("B (100/day) result",       monthlyResult(100,  G, V, FIXED, DAYS),      -110000);
eq("C (200/day) revenue",      monthlyRevenue(200, G, DAYS),                120000);
eq("C (200/day) result",       monthlyResult(200,  G, V, FIXED, DAYS),      -50000);
eq("D (284/day) revenue",      monthlyRevenue(284, G, DAYS),                170400);
eq("D (284/day) result",       monthlyResult(284,  G, V, FIXED, DAYS),      400);

// Break-even threshold
eq("Break-even threshold/day", breakEvenPerDay(FIXED, G, V, DAYS),          284);
eq("Break-even monthly exact", FIXED / (G - V),                              8500);

// Edge cases
eq("Zero volume result",       monthlyResult(0,    G, V, FIXED, DAYS),      -FIXED);
inf("Zero allocation",         breakEvenPerDay(FIXED, 0, 0, DAYS));
inf("Negative contribution",   breakEvenPerDay(FIXED, 10, 15, DAYS));
inf("Zero contribution",       breakEvenPerDay(FIXED, 20, 20, DAYS));

// Different exchange rate
eq("FX 150 KES threshold",     breakEvenPerDay(150000, G, V, DAYS),         Math.ceil(150000/G/DAYS));

// 28-day month
eq("28-day break-even",        breakEvenPerDay(FIXED, G, V, 28),            Math.ceil(8500/28));

// Positive variable platform cost (5 KES SMS cost per parcel)
eq("5 KES varCost threshold",  breakEvenPerDay(FIXED, G, 5, DAYS),          Math.ceil(FIXED/15/DAYS));

// Scenario label consistency: all deficits must be negative
eq("A negative",               monthlyResult(25,  G, V, FIXED, DAYS)  < 0,  true);
eq("B negative",               monthlyResult(100, G, V, FIXED, DAYS)  < 0,  true);
eq("C negative",               monthlyResult(200, G, V, FIXED, DAYS)  < 0,  true);
eq("D positive",               monthlyResult(284, G, V, FIXED, DAYS)  > 0,  true);

// Print
console.log("\n=== PPTT Break-Even Regression Tests ===");
log.forEach(l => console.log(l));
console.log("\nTotal: " + (pass+fail) + " | Passed: " + pass + " | Failed: " + fail);
if (fail) { console.error(fail + " test(s) FAILED."); process.exit(1); }
else { console.log("All tests PASSED."); }
