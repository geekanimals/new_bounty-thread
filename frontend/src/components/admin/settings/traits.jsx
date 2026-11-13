/**
 * 🧩 Creator traits report ka logic — purane app ke CTR_TRAITS / ctrVals / ctrGroup / CSV jaisa hi.
 * Data: api.creator_trait_rows → { rows: [...] }. Yahan sirf hisaab hai (koi UI / network nahi).
 */

export const CTR_TRAITS = [
  ["categories", "Category"], ["skills", "Skill"], ["formats", "Content type"], ["languages", "Language"], ["city", "City"], ["state", "State"],
  ["gender", "Gender"], ["age", "Age"], ["profile", "Profile completion"], ["followers", "Followers"], ["engagement", "Engagement"],
  ["barter", "Takes barter"], ["pet", "Pet parent"], ["parent", "Mom / parent"], ["joined_via", "Joined via"], ["stage", "Campaign step"], ["posted", "Posted?"], ["kind", "On Geek OS?"],
];

const cap1 = (v) => String(v || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const STEPS = {
  applied: "1. Registered", eligible: "2. Screened", sent_to_brand: "3. Sent to brand", brand_confirmed: "4. Brand confirmed", contract_sent: "5. Contract sent",
  contract_signed: "6. Contract signed", address_confirmed: "7. Address confirmed", product_sent: "8. Courier sent", product_delivered: "9. Courier delivered",
  content_created: "10. Video brief sent", content_submitted: "11. Video submitted", changes_requested: "12. Changes asked", content_approved: "13. Client approved",
  published: "14. Posted", completed: "15. Done",
  ineligible: "Declined", brand_declined: "Declined by brand", dropped: "Dropped", rejected: "Rejected",
};
const ALIAS = { invited: "applied", shortlisted: "applied", accepted: "brand_confirmed" };
const stepLabel = (s) => STEPS[ALIAS[s] || s] || cap1(s);
const NOT_GIVEN = ["Not given", "No profile", "No numbers", "Not on a campaign"];

export function ctrVals(r, t) {
  const one = (v) => (v == null || v === "" ? ["Not given"] : [v]);
  const f = Number(r.followers);
  const e = Number(r.engagement);
  const p = r.profile_pct;
  switch (t) {
    case "categories":
    case "skills":
    case "formats":
    case "languages":
      return (r[t] || []).length ? r[t].map(cap1) : ["Not given"];
    case "city":
    case "state":
      return one(r[t] ? cap1(String(r[t]).toLowerCase()) : null);
    case "gender":
      return one(r.gender ? cap1(r.gender) : null);
    case "age":
      return r.age == null ? ["Not given"] : [r.age < 25 ? "18–24" : r.age < 35 ? "25–34" : r.age < 45 ? "35–44" : "45+"];
    case "profile":
      return p == null ? ["No profile"] : [p >= 100 ? "100% complete" : p >= 75 ? "75–99%" : p >= 50 ? "50–74%" : p >= 25 ? "25–49%" : "0–24%"];
    case "followers":
      return r.followers == null ? ["No numbers"] : [f < 1e3 ? "Under 1K" : f < 1e4 ? "Nano 1K–10K" : f < 5e4 ? "Micro 10K–50K" : f < 2e5 ? "Mid 50K–200K" : f < 1e6 ? "Macro 200K–1M" : "Mega 1M+"];
    case "engagement":
      return r.engagement == null ? ["No numbers"] : [e < 1 ? "Under 1%" : e < 3 ? "1–3%" : e < 5 ? "3–5%" : e < 10 ? "5–10%" : "10%+"];
    case "barter":
      return [r.barter === true ? "Yes" : r.barter === false ? "No" : "Not given"];
    case "pet":
      return [r.pet ? "🐾 Has a pet" : "No pet"];
    case "parent":
      return [r.parent ? (r.gender === "male" ? "👨 Dad" : "👩 Mom / parent") : "Not a parent"];
    case "joined_via":
      return [r.joined_via ? cap1(r.joined_via) : "Signed up themselves"];
    case "stage":
      return [r.stage ? stepLabel(r.stage) : "Not on a campaign"];
    case "posted":
      return [Number(r.posted) > 0 ? "✅ Posted" : "Not posted"];
    case "kind":
      return [r.kind === "invite" ? "Not on Geek OS (uploaded)" : "On Geek OS"];
    default:
      return ["—"];
  }
}

/** rows ko ek trait par group karo — har group: n, pct, avg followers / engagement / profile, posted, completed, views, likes */
export function ctrGroup(rows, t) {
  const G = new Map();
  rows.forEach((r) =>
    [...new Set(ctrVals(r, t))].forEach((v) => {
      if (!G.has(v)) G.set(v, []);
      G.get(v).push(r);
    })
  );
  const n = rows.length || 1;
  const avg = (a, k) => {
    const x = a.map((r) => Number(r[k])).filter((v) => !isNaN(v));
    return x.length ? x.reduce((s, v) => s + v, 0) / x.length : null;
  };
  return [...G.entries()]
    .map(([v, a]) => ({
      v,
      rows: a,
      n: a.length,
      pct: Math.round((100 * a.length) / n),
      followers: avg(a.filter((r) => r.followers != null), "followers"),
      eng: avg(a.filter((r) => r.engagement != null), "engagement"),
      profile: avg(a.filter((r) => r.profile_pct != null), "profile_pct"),
      posted: a.filter((r) => Number(r.posted) > 0).length,
      completed: a.filter((r) => Number(r.completed) > 0).length,
      views: a.reduce((s, r) => s + (Number(r.views) || 0), 0),
      likes: a.reduce((s, r) => s + (Number(r.likes) || 0), 0),
    }))
    .sort((x, y) => NOT_GIVEN.includes(x.v) - NOT_GIVEN.includes(y.v) || y.n - x.n || String(x.v).localeCompare(String(y.v)));
}

/** "All creators CSV" — purane ctrCsvRaw jaise columns */
export function traitCsvRows(rows) {
  return [
    ["Name", "Instagram", "On Geek OS", "Followers", "Engagement %", "Profile %", "Categories", "Skills", "Content types", "Languages", "City", "State", "Gender", "Age", "Takes barter", "Pet", "Parent", "Joined via", "Step", "Posted", "Completed", "Views", "Likes"],
    ...rows.map((r) => [
      r.name, r.handle, r.kind === "invite" ? "no" : "yes", r.followers, r.engagement, r.profile_pct, (r.categories || []).join("; "), (r.skills || []).join("; "), (r.formats || []).join("; "),
      (r.languages || []).join("; "), r.city, r.state, r.gender, r.age, r.barter, r.pet ? "yes" : "", r.parent ? "yes" : "", r.joined_via, r.stage, r.posted, r.completed, r.views, r.likes,
    ].map((v) => (v == null ? "" : v))),
  ];
}
