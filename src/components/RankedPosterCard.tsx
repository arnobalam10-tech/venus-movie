import PosterCard from "@/components/PosterCard";
import type { MediaItem } from "@/lib/media";

export default function RankedPosterCard({ rank, item }: { rank: number; item: MediaItem }) {
  return (
    <div className="flex flex-none items-end">
      <span
        aria-hidden
        className="-mr-3 select-none pb-1 text-[4.5rem] font-black italic leading-none text-white/20 sm:text-[6rem]"
      >
        {rank}
      </span>
      <div className="w-[110px] sm:w-[130px]">
        <PosterCard item={item} />
      </div>
    </div>
  );
}
