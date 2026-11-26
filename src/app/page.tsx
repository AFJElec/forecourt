import { loadHome } from "@/lib/pages/loaders";
import { HomeView } from "@/views/home-view";

export const revalidate = 300;

export default async function HomePage() {
  return <HomeView data={await loadHome()} />;
}
