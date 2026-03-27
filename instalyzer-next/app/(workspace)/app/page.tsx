import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function AppHomePage() {
  return (
    <RoutePlaceholder
      route="/app"
      label="Application home"
      description="This is the initial entry point for the app layer. It will eventually guide people into datasets, recent work, and onboarding."
      family="workspace"
      nextSteps={[
        "Decide whether this route stays as a real hub or redirects to datasets.",
        "Introduce dataset summary cards once client-side mock data exists.",
        "Align the shell with the future authenticated workspace model.",
      ]}
      links={[
        { href: "/app/datasets", label: "Open datasets" },
        { href: "/app/datasets/new?entry=app-home", label: "Create dataset" },
      ]}
    />
  );
}
