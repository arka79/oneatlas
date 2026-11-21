import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProviderNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <EmptyState
        icon={<SearchX className="size-5" />}
        title="Provider not found"
        description="We could not find that provider in the catalogue. It may have been renamed, or the link may be out of date."
        action={
          <ButtonLink href="/providers" variant="primary">
            Browse providers
          </ButtonLink>
        }
      />
    </div>
  );
}
