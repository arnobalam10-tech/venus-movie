import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TvPairForm from "@/components/tv/TvPairForm";
import TvConnected from "@/components/tv/TvConnected";

export const metadata: Metadata = { title: "TV — Venus" };

export default async function TvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = user
    ? await supabase
        .from("tv_devices")
        .select("paired_at")
        .eq("user_id", user.id)
        .not("paired_at", "is", null)
        .order("paired_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="mb-1 bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-3xl font-bold text-transparent">
        Venus TV
      </h1>
      {data ? (
        <TvConnected pairedAt={data.paired_at as string} />
      ) : (
        <>
          <p className="mb-8 text-sm text-muted">
            Open the Venus app on your TV and enter the code it shows.
          </p>
          <TvPairForm />
        </>
      )}
    </div>
  );
}
