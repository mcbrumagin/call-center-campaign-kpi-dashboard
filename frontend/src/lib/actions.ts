'use server';

import { redirect } from 'next/navigation';
import { authApi } from './api';
import { createSession, deleteSession } from './session';

export interface LoginState {
  error?: string;
  success?: boolean;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required' };
  }

  try {
    const response = await authApi.login(username, password);
    await createSession(response.access_token, username, 'admin');
    
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Invalid username or password' };
  }

  redirect('/admin');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
