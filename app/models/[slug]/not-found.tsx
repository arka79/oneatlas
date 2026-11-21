import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ModelNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <EmptyState
        icon={<SearchX className="size-5" />}
        title="Model not found"
        description="We could not find that model in the catalog. It may have been renamed, or the link may be out of date."
        action={<ButtonLink href="/models" variant="primary">Browse the catalog</ButtonLink>}
      />
    </div>
  );
}
