import DataClient from "@/components/data/DataClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion des données — C.LC. Traiteur" };

export default function DataPage() {
  return <DataClient />;
}
