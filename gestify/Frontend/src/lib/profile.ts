export interface UserProfile {
  name: string;
  company: string;
  role: string;
  email: string;
  avatarUrl: string;
}

const PROFILE_KEY = "gestify_profile";

export const DEFAULT_PROFILE: UserProfile = {
  name: "Joas Kelph",
  company: "Kelph Studio",
  role: "Chef / Gestor",
  email: "joaskelph18@gmail.com",
  avatarUrl: "",
};

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getProfileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "GK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
