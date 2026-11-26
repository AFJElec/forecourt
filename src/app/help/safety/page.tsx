import { contentPages } from "@/content/pages";
import { ContentPage } from "@/views/content-view";

export const metadata = { title: "Buying safely" };
export default function Page() { return <ContentPage page={contentPages["help/safety"]!} />; }
