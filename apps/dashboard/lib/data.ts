import { dataClient } from "@zipform/data";
import { cache } from "react";
import { auth } from "../auth";

export { dataClient };

export const getCurrentUser = cache(async () => {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (email) {
    const users = await dataClient.tloz.getUsers();
    const user = users.find((candidate) => candidate.email.trim().toLowerCase() === email);
    if (user) return user;
  }

  return dataClient.user.getCurrent();
});
