import { redirect } from "next/navigation";

export default function Page() {
  // send to marketplace with TapGame filter enabled
  redirect("/marketplace?tapgame=1");
}
