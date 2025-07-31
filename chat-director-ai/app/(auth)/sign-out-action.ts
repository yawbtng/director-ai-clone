'use server';

import { signOut } from '@/app/(auth)/auth';

export async function signOutAction() {
  await signOut({
    redirectTo: '/',
  });
}
