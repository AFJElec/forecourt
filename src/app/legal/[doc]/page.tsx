import { notFound } from "next/navigation";
import { ContentPage } from "@/views/content-view";
import { contentPages } from "@/content/pages";

export function generateStaticParams() {
  return ["terms", "privacy", "cookies"].map((doc) => ({ doc }));
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const page = contentPages[`legal/${(await params).doc}`];
  if (!page) notFound();
  return <ContentPage page={page} />;
}
