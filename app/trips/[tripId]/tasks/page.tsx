import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { TasksRouteClient } from "@/features/tasks/TasksRouteClient";

type TasksPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function TasksPage({ params }: TasksPageProps) {
  const { tripId } = await params;

  return (
    <AppShell>
      <ProtectedRoute>
        <TasksRouteClient tripId={tripId} />
      </ProtectedRoute>
    </AppShell>
  );
}
