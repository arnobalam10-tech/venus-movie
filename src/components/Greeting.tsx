import { createClient } from "@/lib/supabase/server";
import { getGreetingForEmail } from "@/lib/greetings";

export default async function Greeting() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const message = getGreetingForEmail(user?.email);
  if (!message) return null;

  return (
    <div className="border-b border-white/5 bg-surface/60 px-4 py-2 text-center text-sm text-foreground sm:px-6">
      {message}
    </div>
  );
}
