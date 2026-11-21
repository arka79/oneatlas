import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function LabNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <EmptyState
        icon={<SearchX className="size-5" />}
        title="Lab not found"
        description="We could not find that lab in the catalogue. It may have been renamed, or the link may be out of date."
        action={
          <ButtonLink href="/labs" variant="primary">
            Browse labs
          </ButtonLink>
        }
      />
    </div>
  );
}
