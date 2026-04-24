import { SeaGoApp } from "@/components/SeaGoApp";
import { cities, quests } from "@/lib/quests";

export default function Home() {
  return <SeaGoApp initialCities={cities} initialQuests={quests} />;
}

