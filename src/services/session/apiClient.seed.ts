import type { Encounter, UserSettings } from './apiClient'

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export const SEED_SETTINGS: UserSettings = {
  noteLanguage: 'en',
  noteTemplate: 'soap',
}

export const SEED_ENCOUNTERS: (Encounter & { note: string })[] = [
  {
    id: 'enc-1',
    patientName: 'Emma Laurent',
    startedAt: hoursAgo(0.5),
    reason: 'Persistent cough',
    status: 'draft',
    note: 'Dry cough for 3 weeks, worse at night. No fever. Non-smoker.\nLungs clear on auscultation.\nPlan: chest X-ray, reassess in 2 weeks.',
  },
  {
    id: 'enc-2',
    patientName: 'Lucas Moreau',
    startedAt: hoursAgo(1.5),
    reason: 'Follow-up: hypertension',
    status: 'draft',
    note: 'BP 138/86 on lisinopril 10 mg. Reports good adherence.\nPlan: continue current dose, home BP log, labs in 3 months.',
  },
  {
    id: 'enc-3',
    patientName: 'Chloé Bernard',
    startedAt: hoursAgo(3),
    reason: 'Lower back pain',
    status: 'completed',
    note: 'Mechanical low back pain after lifting, 5 days. No red flags.\nPlan: NSAIDs, stay active, physiotherapy referral.',
  },
  {
    id: 'enc-4',
    patientName: 'Hugo Petit',
    startedAt: hoursAgo(5),
    reason: 'Annual check-up',
    status: 'completed',
    note: 'Healthy 42-year-old. Vaccinations up to date.\nPlan: fasting lipid panel, return in 12 months.',
  },
  {
    id: 'enc-5',
    patientName: 'Léa Dubois',
    startedAt: hoursAgo(24),
    reason: 'Migraine',
    status: 'draft',
    note: 'Episodic migraine with aura, ~2 per month.\nPlan: triptan as needed, headache diary.',
  },
  {
    id: 'enc-6',
    patientName: 'Nathan Roux',
    startedAt: hoursAgo(26),
    reason: 'Sprained ankle',
    status: 'completed',
    note: 'Inversion injury while running. Ottawa rules negative.\nPlan: RICE, compression, gradual return to activity.',
  },
  {
    id: 'enc-7',
    patientName: 'Inès Fontaine',
    startedAt: hoursAgo(49),
    reason: 'Seasonal allergies',
    status: 'completed',
    note: 'Rhinitis and itchy eyes each spring.\nPlan: daily antihistamine, nasal corticosteroid.',
  },
]
