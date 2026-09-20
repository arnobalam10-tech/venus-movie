import type { Metadata } from "next";
import SearchClient from "@/components/search/SearchClient";

export const metadata: Metadata = {
  title: "Search — Venus",
};

export default function SearchPage() {
  return <SearchClient />;
}
