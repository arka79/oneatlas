import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Token cost calculator" };

export default function CalculatorPage() {
  return (
    <ComingSoon
      milestone="Milestone 4"
      title="Token cost calculator"
      description="Estimate request and monthly costs from real catalog pricing, with clearly stated assumptions."
    />
  );
}
