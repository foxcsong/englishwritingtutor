import { UserProfile, StudentLevel, HistoryRecord, UserConfig } from '../types';
import { BADGES } from '../constants';

const API_BASE = '/api';

export const getProfile = async (username: string): Promise<UserProfile | null> => {
  try {
    const res = await fetch(`${API_BASE}/profile?username=${username}`);
    if (!res.ok) return null;
    const profile = await res.json();
    return profile;
  } catch (e) {
    return null;
  }
};

export const saveProfile = async (profile: UserProfile): Promise<UserProfile> => {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: profile.username,
      points: profile.points,
      badges: profile.badges,
      level: profile.level,
      config: profile.config
    })
  });
  return await res.json();
};

export const saveAIConfig = async (username: string, config: UserConfig): Promise<void> => {
  await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, config })
  });
};

export const updatePointsAndBadges = async (currentProfile: UserProfile, pointsToAdd: number): Promise<{ profile: UserProfile, newBadges: string[] }> => {
  const newPoints = currentProfile.points + pointsToAdd;
  const newBadges: string[] = [];

  BADGES.forEach(badge => {
    if (newPoints >= badge.threshold && !currentProfile.badges.includes(badge.id)) {
      newBadges.push(badge.id);
    }
  });

  const updatedProfile = await saveProfile({
    ...currentProfile,
    points: newPoints,
    badges: [...currentProfile.badges, ...newBadges]
  });

  return { profile: updatedProfile, newBadges };
};

export const addHistory = async (username: string, record: HistoryRecord): Promise<void> => {
  await fetch(`${API_BASE}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, record })
  });
};

export const getHistory = async (username: string): Promise<HistoryRecord[]> => {
  const res = await fetch(`${API_BASE}/history?username=${username}`);
  return await res.json();
};

export const logoutUser = () => {
  localStorage.removeItem('yingyu_xiezuo_current_user');
};

export const changePassword = async (username: string, oldPassword: string, newPassword: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/auth?action=change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, oldPassword, newPassword })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Failed to change password' }));
    throw new Error(data.error || 'Failed to change password');
  }
};