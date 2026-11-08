/**
 * Audit d'accessibilité automatique (axe-core, normes WCAG 2.1 AA) des pages
 * publiques, en mobile et en ordinateur.
 *   node scripts/audit-accessibilite.cjs [https://www.encoreunehistoire.fr]
 * Code de sortie 1 s'il reste des problèmes « graves » ou « critiques ».
 */
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");

const BASE = process.argv[2] || "https://www.encoreunehistoire.fr";
const PAGES = ["/", "/catalogue", "/catalogue/noel", "/club", "/demo", "/connexion", "/inscription", "/livre-personnalise/5-6-ans", "/confidentialite"];
const ECRANS = [["mobile", 390, 844], ["ordinateur", 1280, 800]];

(async () => {
  const navigateur = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const tous = new Map();
  for (const [nomEcran, w, h] of ECRANS) {
    for (const chemin of PAGES) {
      const contexte = await navigateur.newContext({ viewport: { width: w, height: h } });
      const page = await contexte.newPage();
      await page.goto(BASE + chemin, { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
        window.scrollTo(0, 0);
      });
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
      for (const v of r.violations) {
        const cle = v.id;
        const e = tous.get(cle) ?? { id: v.id, impact: v.impact, aide: v.help, url: v.helpUrl, pages: new Set(), exemples: new Set() };
        e.pages.add(`${chemin} (${nomEcran})`);
        v.nodes.slice(0, 3).forEach((n) => e.exemples.add(`${n.target.join(" ")} — ${n.failureSummary?.split("\n").slice(1, 2).join(" ").trim()}`));
        tous.set(cle, e);
      }
      await contexte.close();
    }
  }
  await navigateur.close();
  const ordre = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const liste = [...tous.values()].sort((a, b) => ordre[a.impact] - ordre[b.impact]);
  console.log(`${liste.length} règle(s) en défaut\n`);
  for (const e of liste) {
    console.log(`[${e.impact}] ${e.id} : ${e.aide}`);
    console.log(`   pages : ${[...e.pages].slice(0, 6).join(", ")}${e.pages.size > 6 ? ` (+${e.pages.size - 6})` : ""}`);
    [...e.exemples].slice(0, 4).forEach((x) => console.log(`   - ${x.slice(0, 190)}`));
  }
  process.exit(liste.some((e) => e.impact === "critical" || e.impact === "serious") ? 1 : 0);
})();
