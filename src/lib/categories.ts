export const INCOME_SOURCES = [
  "Test Fees",
  "Sample Processing",
  "Research Grant",
  "Consultation Fees",
  "Insurance Reimbursement",
  "Equipment Rental",
  "Training Programs",
  "Quality Audits",
  "Other",
];

export const EXPENSE_CATEGORIES = [
  "Reagents & Chemicals",
  "Lab Consumables",
  "Equipment Purchase",
  "Equipment Maintenance",
  "Calibration & Validation",
  "Glassware",
  "PPE & Safety",
  "Biohazard Disposal",
  "Specimen Collection",
  "Lab Utilities",
  "Staff Salaries",
  "Software & LIMS",
  "Accreditation & Licensing",
  "Training & CME",
  "Other",
];

export const categoryColor = (name: string) => {
  // deterministic HSL based on string
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 60%)`;
};