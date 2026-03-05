export const BADGE_TIERS = [
  { level: 1, name: 'Rookie', requiredCheckins: 10 },
  { level: 2, name: 'Warrior', requiredCheckins: 30 },
  { level: 3, name: 'Builder', requiredCheckins: 75 },
  { level: 4, name: 'Iron', requiredCheckins: 150 },
  { level: 5, name: 'Wolf', requiredCheckins: 300 },
] as const;

export function getBadge(totalCheckins: number): { level: number; name: string } | null {
  let badge: { level: number; name: string } | null = null;
  for (const tier of BADGE_TIERS) {
    if (totalCheckins >= tier.requiredCheckins) {
      badge = { level: tier.level, name: tier.name };
    } else {
      break;
    }
  }
  return badge;
}

export function formatUserForResponse(
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    picture?: string | null;
    total_checkins?: number;
    role?: string;
  },
  extra?: { email?: string; skip_build_team?: boolean; created_at?: Date },
) {
  const totalCheckins = user.total_checkins ?? 0;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    picture: user.picture,
    total_checkins: totalCheckins,
    badge: getBadge(totalCheckins),
    role: user.role ?? 'user',
    ...extra,
  };
}
