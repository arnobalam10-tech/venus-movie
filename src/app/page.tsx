import { Suspense } from "react";
import Greeting from "@/components/Greeting";
import Hero from "@/components/Hero";
import RowSkeleton from "@/components/RowSkeleton";
import JumpBackInRow from "@/components/rows/JumpBackInRow";
import TrendingRow from "@/components/rows/TrendingRow";
import TopTenMoviesRow from "@/components/rows/TopTenMoviesRow";
import TopTenShowsRow from "@/components/rows/TopTenShowsRow";
import TopRatedRow from "@/components/rows/TopRatedRow";
import NewReleasesRow from "@/components/rows/NewReleasesRow";
import GenreRows from "@/components/rows/GenreRows";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={null}>
        <Greeting />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-[55vh] min-h-[360px] w-full animate-pulse bg-surface sm:h-[65vh]" />
        }
      >
        <Hero />
      </Suspense>

      <div className="flex flex-col gap-2 py-6">
        <Suspense fallback={<RowSkeleton title="Jump Back In" />}>
          <JumpBackInRow />
        </Suspense>
        <Suspense fallback={<RowSkeleton title="Trending Now" />}>
          <TrendingRow />
        </Suspense>
        <Suspense fallback={<RowSkeleton title="Top 10 Movies Today" />}>
          <TopTenMoviesRow />
        </Suspense>
        <Suspense fallback={<RowSkeleton title="Top 10 TV Shows Today" />}>
          <TopTenShowsRow />
        </Suspense>
        <Suspense fallback={<RowSkeleton title="Top Rated" />}>
          <TopRatedRow />
        </Suspense>
        <Suspense fallback={<RowSkeleton title="New Releases" />}>
          <NewReleasesRow />
        </Suspense>
        <Suspense fallback={<RowSkeleton />}>
          <GenreRows />
        </Suspense>
      </div>
    </div>
  );
}
