import { Clock } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

type ComingSoonProps = {
  title: string;
  description: string;
  milestone: string;
};

/**
 * Honest shell for routes whose milestone has not shipped yet. Keeping these
 * pages real means the navigation never 404s, and no fake data is shown.
 */
export function ComingSoon({ title, description, milestone }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow={milestone} title={title} description={description} />
      <EmptyState
        icon={<Clock className="size-5" />}
        title="In progress"
        description={`This view is planned for ${milestone.toLowerCase()}. The model catalog and detail pages are available now.`}
        action={<ButtonLink href="/models">Explore the catalog</ButtonLink>}
      />
    </div>
  );
}
