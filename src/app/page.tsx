import { redirect } from "next/navigation";
import { auth } from "@/src/lib/firebase";

export default function Home() {
  const currentUser = auth.currentUser;

  if (currentUser) {
    redirect("/dashboard/user");
  } else {
    redirect("/login");
  }
}

