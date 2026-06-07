export type SessionUser = {
  name: string;
  email: string;
};

type StoredUser = SessionUser & {
  password: string;
};

const USERS_KEY = "oncoassist.auth.users";
const SESSION_KEY = "oncoassist.auth.session";

function getStoredUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.email || !parsed?.name) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSessionUser(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSessionUser(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function registerUser(name: string, email: string, password: string): SessionUser {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getStoredUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const nextUser: StoredUser = {
    name: name.trim(),
    email: normalizedEmail,
    password,
  };

  users.push(nextUser);
  saveStoredUsers(users);

  return {
    name: nextUser.name,
    email: nextUser.email,
  };
}

export function loginWithCredentials(email: string, password: string): SessionUser {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getStoredUsers();

  const foundUser = users.find(
    (user) => user.email === normalizedEmail && user.password === password,
  );

  if (!foundUser) {
    throw new Error("Invalid email or password.");
  }

  return {
    name: foundUser.name,
    email: foundUser.email,
  };
}
