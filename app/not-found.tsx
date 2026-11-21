import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <EmptyState
        icon={<SearchX className="size-5" />}
        title="Page not found"
        description="That route does not exist. The model catalog, detail pages, and API are available from the sidebar."
        action={
          <>
            <ButtonLink href="/" variant="primary">
              Go to dashboard
            </ButtonLink>
            <ButtonLink href="/models">Browse models</ButtonLink>
          </>
        }
      />
    </div>
  );
}
