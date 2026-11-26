import { contentPages } from "@/content/pages";
import { ContentPage } from "@/views/content-view";

export const metadata = { title: "About us" };
export default function Page() { return <ContentPage page={contentPages.about!} />; }
