# Πλάνο υλοποίησης — εκκρεμότητες (έως myDATA)

> **Τελευταία ενημέρωση:** 21 Μαΐου 2026 · `main` @ `e942f75`  
> **Στόχος:** ολοκλήρωση όλων των εκκρεμοτήτων B + A4 πρακτικό, **myDATA (AADE) τελευταίο**.  
> **Εκτός scope:** ενότητα **Δ** (μεγάλο spec: portal, cloud sync, lab, payroll κ.λπ.)

---

## Τι θεωρείται ήδη ολοκληρωμένο (δεν επαναλαμβάνεται)

- **Ε** — MVP κλινική, ραντεβού v18, τιμολόγια/αποδείξεις, BOM v19, αναφορές βασικές  
- **Α** — Checklist, §8 PASS, A3 env, A5 PBKDF2 auth, docs Release/Xcode  
- **B1 (κύριο)** — Έσοδα/χρεώσεις, εκκρεμή τιμολόγια, συνολικές απαιτήσεις, CSV από Αναφορές  
- **B2 (κύριο)** — Μερική πληρωμή, UI X/Y, πολλαπλές πληρωμές  
- **B3 (μερικό)** — BOM, prompt αφαίρεσης, στατιστικά στην οθόνη **Αποθήκη**

---

## Σειρά φάσεων (από εμάς)

| Φάση | ID | Εστίαση | Γιατί αυτή η σειρά |
|------|-----|---------|-------------------|
| **0** | B5 | CI + smoke gate | Προστατεύει κάθε επόμενο commit (`tsc`, `env:check`, optional lint) |
| **1** | B1+ | Αναφορές (PDF, σύγκριση) | Ήδη ανοιχτό tab· γρήγορο value για διοίκηση |
| **2** | B2+ | Οικονομικά (αποδείξεις, ΦΠΑ report) | Κλείνει χρηματική σαφήνεια πριν αποθήκη/reminders |
| **3** | B3+ | Αποθήκη advanced | Ρύθμιση auto-deduct, λήξεις, σύνδεση με Αναφορές |
| **4** | B4 | Ραντεβού (push/SMS/grid) | Χρειάζεται infra/keys· μετά σταθερό core |
| **5** | A4+ | Release pipeline | EAS/TestFlight όταν το feature-set είναι κλειδωμένο |
| **6** | Γ | **myDATA AADE** | **Τελευταίο** — εξάρτηση από credentials, νομοθεσία, UAT |

---

## Φάση 0 — B5: Tests & CI ✅

| # | Εργασία | Αποτέλεσμα | Κριτήριο ολοκλήρωσης |
|---|---------|------------|------------------------|
| 0.1 | GitHub Actions: `npm install` → `type-check` → `env:check` → `npm test` | `.github/workflows/ci.yml` | PR/push πράσινο |
| 0.2 | Jest: `report.service`, `invoice.parsing`, `password.service` | 8 tests | `npm test` PASS |
| 0.3 | Ενημέρωση README + IMPLEMENTATION_PLAN | docs | Ομάδα ξέρει πώς τρέχει CI |

**Ολοκληρώθηκε:** B5.

---

## Φάση 1 — B1+: Αναφορές admin ✅

| # | Εργασία | Σημείωση |
|---|---------|----------|
| 1.1 | **Export PDF** μηνιαίας αναφοράς (share sheet, όπως τιμολόγιο PDF) | `reportPdf.service.ts` · KPIs + πίνακες |
| 1.2 | **Σύγκριση μήνα-με-μήνα** (έσοδα, χρεώσεις, νέοι ασθενείς, Δ%) | Γραμμή «vs προηγ. μήνα» στις κάρτες + στήλη στο PDF |
| 1.3 | **Low stock count** στην Αναφορές (read-only KPI) | Κάρτα + hint στην κάρτα Αποθήκη |

**Ολοκληρώθηκε:** PDF, σύγκριση μηνών, low-stock KPI.

**Ήδη έτοιμο (πριν):** έσοδα/χρεώσεις, εκκρεμή τιμολόγια, συνολικές απαιτήσεις, CSV, top 15.

---

## Φάση 2 — B2+: Οικονομικά fine-tuning ✅

| # | Εργασία | Σημείωση |
|---|---------|----------|
| 2.1 | **Κανόνες αποδείξεων** — banner, hints, confirm, block reasons | `getReceiptIssueBlockReason` |
| 2.2 | **«Οικονομική σύνοψη μήνα»** στην Αναφορές | `getMonthlyFinancialSummary` |
| 2.3 | Φίλτρο τιμολογίων (Όλα / Πρόχειρα / Εκδοθέντα / Πληρωμένα) | `PatientInvoicesScreen` |

**Ολοκληρώθηκε:** κανόνες απόδειξης (UX), σύνοψη ΦΠΑ/τιμολογίων, φίλτρο.

**Ήδη έτοιμο (πριν):** μερική πληρωμή, πληρώθηκε X/Y, πολλαπλές πληρωμές.

---

## Φάση 3 — B3+: Αποθήκη advanced ✅

| # | Εργασία | Σημείωση |
|---|---------|----------|
| 3.1 | **Ρύθμιση** «Αυτόματη αφαίρεση υλικών» ON/OFF | `practice_settings.auto_deduct_inventory` · Ρυθμίσεις |
| 3.2 | **Ημερομηνία λήξης** ανά είδος + badges | Migration v20 · `expiry_date` |
| 3.3 | Φίλτρα **Λήγουν σύντομα** / **Ληγμένα** | Αποθήκη |
| 3.4 | **Όχι** purchase orders | Εκτός MVP |

**Ολοκληρώθηκε:** auto-deduct, λήξεις, φίλτρα.

**Ήδη έτοιμο (πριν):** BOM, dialog deduct (OFF), stats Αποθήκη, low-stock Αναφορές (1.3).

---

## Φάση 4 — B4: Ραντεβού

| # | Εργασία | Σημείωση |
|---|---------|----------|
| 4.1 | **SMS background** — expo-task ή documented limitation + best-effort scheduler | Ελάχιστο: doc + env flags |
| 4.2 | **Remote push (FCM)** — backlog φάσης 2· χρειάζεται backend ή Expo push service | Μεγάλο· υπο-φάσεις 4.2a token 4.2b send |
| 4.3 | Ρύθμιση **πλήρες / σύντομο** όνομα στο grid | `reminder_settings` ή νέο πεδίο |
| 4.4 | Year grid polish | Χαμηλή προτεραιότητα — τελευταίο μέσα στη B4 |

**Εκκρεμότητες που κλείνουν:** B4 (με ρεαλιστικό scope για 4.2).

**Ήδη έτοιμο:** week/month/year grid, τοπικό push v18, SMS όταν ανοίγει app.

---

## Φάση 5 — A4+: Production release

| # | Εργασία | Σημείωση |
|---|---------|----------|
| 5.1 | `eas.json` profiles + secrets documentation | Σύνδεση με [docs/PRODUCTION_ENV.md](./docs/PRODUCTION_ENV.md) |
| 5.2 | TestFlight / internal distribution checklist | Επέκταση [docs/XCODE_RELEASE_BUILD.md](./docs/XCODE_RELEASE_BUILD.md) |
| 5.3 | Versioning / build number policy | `app.json` + release notes template |

**Εκκρεμότητες που κλείνουν:** A4 πέρα από «docs μόνο».

---

## Φάση 6 — Γ: myDATA / AADE (ΤΕΛΕΥΤΑΙΟ)

| # | Εργασία | Σημείωση |
|---|---------|----------|
| 6.1 | Integration spec AADE (endpoints, credentials, error codes) | Ξεχωριστό `BACKLOG_MYDATA.md` |
| 6.2 | Πραγματική υποβολή τιμολογίου/απόδειξης | Αντικατάσταση προσομοίωσης |
| 6.3 | Ακύρωση / διορθωτικά (αν απαιτούνται) | Νομική αξιολόγηση |
| 6.4 | UAT με λογιστή / sandbox AADE | Πριν production ON |

**Μέχρι τότε:** προσομοίωση mark + PDF + CSV — **δεν αγγίζεται** στην φάση 6.

---

## Ενότητα Δ — Εκτός πλάνου (μεγάλο spec)

Δεν εκτελείται σε αυτό το πλάνο:

- Online booking / ασθενής portal  
- Cloud backup / multi-device sync (πέρα από manual DB export)  
- Πλήρες RBAC UI ανά ρόλο  
- Lab orders, payroll, marketing  
- Πλήρες imaging / annotations module  
- Purchase orders / παραλαβές προμηθευτή (πλήρες ERP-style)

---

## Πίνακας εκκρεμοτήτων → φάση

| Εκκρεμότητα (από τη λίστα σου) | Φάση |
|--------------------------------|------|
| Export PDF από Αναφορές | 1 ✅ |
| Σύγκριση μήνα-με-μήνα | 1 ✅ |
| Στατιστικά αποθήκης στην Αναφορές | 1 ✅ |
| Κανόνες αποδείξεων (UI) | 2 ✅ |
| Reports τιμολογίων / ΦΠΑ | 2 ✅ |
| Auto-deduct χωρίς dialog (ON/OFF) | 3 ✅ |
| Ημερομηνίες λήξης υλικών | 3 ✅ |
| Παραγγελίες προμηθευτή | **Εκτός MVP** |
| Remote push FCM | 4 |
| SMS background | 4 |
| Full/short όνομα grid | 4 |
| Year grid polish | 4 |
| Jest tests | 0 ✅ |
| GitHub Actions CI | 0 ✅ |
| EAS / TestFlight pipeline | 5 |
| myDATA AADE πραγματικό | **6 (τελευταίο)** |

---

## Πώς θα σημειώνεται πρόοδος

Κατά την υλοποίηση:

1. Checkbox σε αυτό το αρχείο (ή `PROGRESS_SUMMARY.md`) ανά φάση  
2. Commit ανά φάση ή υπο-φάση (π.χ. `feat(reports): monthly PDF export`)  
3. Ενημέρωση [MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md) όπου χρειάζεται  
4. Μετά κάθε φάση: **Release build** στο iPhone για έλεγχο (όχι μόνο push στο Git)

---

## Επόμενο βήμα εκτέλεσης

**Φάση 4 (B4):** push/SMS ραντεβού, grid polish, year view.

---

*Σειρά όπως παραπάνω (χωρίς αναδιάταξη). myDATA πάντα τελευταίο (Φάση 6).*
