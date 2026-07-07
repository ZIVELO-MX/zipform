"use server";

import { auth } from "../auth";
import { dataClient, type UserUpdateInput } from "@zipform/data";
import { revalidatePath } from "next/cache";

export async function updateProfile(input: UserUpdateInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const user = await dataClient.user.update(session.user.id, input);
  revalidatePath("/", "layout");
  return user;
}
