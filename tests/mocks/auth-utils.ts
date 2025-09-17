let mockUser: any = null;

export function __setMockUser(user: any) {
  mockUser = user;
}

export function __resetMockUser() {
  mockUser = null;
}

export async function getCurrentUser() {
  return mockUser;
}
