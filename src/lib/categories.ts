export const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Business",
  "Investments",
  "Gift",
  "Refund",
  "Other",
];

export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Rent",
  "Utilities",
  "Shopping",
  "Health",
  "Education",
  "Entertainment",
  "Subscriptions",
  "Other",
];

export const categoryColor = (name: string) => {
  // deterministic HSL based on string
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 60%)`;
};