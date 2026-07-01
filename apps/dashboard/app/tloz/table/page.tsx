import { redirect } from "next/navigation";

export default function TableRedirect() {
  redirect("/tloz?view=table");
}
