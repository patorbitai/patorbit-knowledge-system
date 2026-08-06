import { Clock } from "lucide-react";
import WidgetCard from "./WidgetCard";
import EmptyState from "./EmptyState";

export default function ActivityWidget() {
  return (
    <WidgetCard title="Recent Activity" icon={Clock}>
      <EmptyState
        title="No recent activity"
        description="Resume edits, verification updates, and AI actions will show up here."
      />
    </WidgetCard>
  );
}
