// Target calculation — Mifflin-St Jeor BMR + activity multiplier + deficit

const ACTIVITY = {
  sedentary:        { label: 'Sedentary (desk job, no exercise)', factor: 1.2 },
  lightly_active:   { label: 'Lightly active (1–3 days/week)', factor: 1.375 },
  moderately_active:{ label: 'Moderately active (3–5 days/week)', factor: 1.55 },
  very_active:      { label: 'Very active (6–7 days/week)', factor: 1.725 },
  extra_active:     { label: 'Extra active (athlete / physical job)', factor: 1.9 },
};

function calcBMR(profile) {
  const { weight_kg, height_cm, age, sex } = profile;
  // Mifflin-St Jeor
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

function calcTargets(profile) {
  const bmr  = calcBMR(profile);
  const factor = ACTIVITY[profile.activity_level]?.factor ?? 1.375;
  const tdee = bmr * factor;
  const targetCal = Math.round(tdee - (profile.deficit_kcal || 0));

  // Protein: 1.8g/kg body weight; Fat: ~25% of target calories / 9; Carbs: remainder
  const protein_g = Math.round(1.8 * profile.weight_kg);
  const fat_g     = Math.round((targetCal * 0.25) / 9);

  return {
    calories:  Math.max(targetCal, 1200),
    protein_g,
    fat_g,
    tdee: Math.round(tdee),
    bmr: Math.round(bmr),
  };
}

// Returns how "full" a macro is as a percentage (capped at 100 for display)
function pct(value, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

// Colour class for progress bars / numbers
function statusClass(value, target) {
  const p = (value / target) * 100;
  if (p >= 100) return 'over';
  if (p >= 85)  return 'near';
  return 'ok';
}
