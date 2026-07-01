import { redirect } from "next/navigation";

export default function BoardRedirect() {
  redirect("/tloz?view=board");
}
