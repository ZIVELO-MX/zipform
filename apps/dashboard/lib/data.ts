import { dataClient } from "@tloz/data";
import { cache } from "react";
import { auth } from "../auth";

export { dataClient };

export const getCurrentUser = cache(async () => {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (email) {
    const user = await dataClient.tloz.getUserByEmail(email);
    if (user) return user;
  }

  return dataClient.user.getCurrent();
});
