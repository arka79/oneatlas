import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type TagProps = {
  children: ReactNode;
  tone?: "neutral" | "primary";
};

/** Small metadata chip used on cards and the model detail header. */
export function Tag({ children, tone = "neutral" }: TagProps) {
  return <Badge variant={tone}>{children}</Badge>;
}
