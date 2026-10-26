export const interactionExamples = [
  {
    id: 1,
    drug1: "Warfarin",
    drug2: "Aspirin",
    severity: "major",
    mechanism: "Additive anticoagulant effects",
    clinicalEffect: "Increased risk of bleeding complications",
    management: "Monitor INR closely, consider dose adjustment",
    evidence: "well-established",
    frequency: "common"
  },
  {
    id: 2,
    drug1: "Digoxin",
    drug2: "Furosemide",
    severity: "moderate",
    mechanism: "Hypokalemia increases digoxin toxicity",
    clinicalEffect: "Enhanced digitalis toxicity symptoms",
    management: "Monitor potassium levels, supplement if needed",
    evidence: "well-established",
    frequency: "frequent"
  },
  {
    id: 3,
    drug1: "Metformin",
    drug2: "Contrast Media",
    severity: "major",
    mechanism: "Reduced renal clearance of metformin",
    clinicalEffect: "Risk of lactic acidosis",
    management: "Hold metformin 48h before/after contrast",
    evidence: "well-established",
    frequency: "occasional"
  },
  {
    id: 4,
    drug1: "ACE Inhibitors",
    drug2: "NSAIDs",
    severity: "moderate",
    mechanism: "Reduced renal function, hyperkalemia",
    clinicalEffect: "Decreased antihypertensive effect, kidney injury",
    management: "Monitor renal function and electrolytes",
    evidence: "well-established",
    frequency: "common"
  },
  {
    id: 5,
    drug1: "Simvastatin",
    drug2: "Clarithromycin",
    severity: "major",
    mechanism: "CYP3A4 inhibition increases statin levels",
    clinicalEffect: "Increased risk of myopathy and rhabdomyolysis",
    management: "Avoid combination or use alternative antibiotic",
    evidence: "well-established",
    frequency: "rare"
  },
  {
    id: 6,
    drug1: "Insulin",
    drug2: "Beta-blockers",
    severity: "moderate",
    mechanism: "Masking of hypoglycemic symptoms",
    clinicalEffect: "Delayed recognition of hypoglycemia",
    management: "Educate patient, monitor glucose closely",
    evidence: "well-established",
    frequency: "frequent"
  }
]

export type InteractionExample = (typeof interactionExamples)[number];

export function interactionCsv(rows: InteractionExample[]) {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = ["Dataset", "Drug 1", "Drug 2", "Severity", "Clinical effect", "Mechanism", "Management", "Evidence", "Frequency"];
  return [header, ...rows.map((row) => ["Example data", row.drug1, row.drug2, row.severity, row.clinicalEffect, row.mechanism, row.management, row.evidence, row.frequency])]
    .map((row) => row.map(quote).join(",")).join("\r\n");
}
