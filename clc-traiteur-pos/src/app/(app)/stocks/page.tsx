import StocksClient from "@/components/stocks/StocksClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion des stocks — C.LC. Traiteur" };

export default function StocksPage() {
  return <StocksClient />;
}
