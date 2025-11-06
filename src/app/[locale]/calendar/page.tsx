"use client";

import { useSearchParams } from "next/navigation";
import { Calendar } from "../../components/Calendar/Calendar";
import { Dumbbell, Activity, Apple } from "lucide-react"; // ✅ Activity instead of Running

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course"); // e.g. "kurse", "community", etc.

  const courses = [
    {
      name: "Strength Training",
      date: "2025-11-10",
      icon: <Dumbbell size={24} />,
      color: "#FF6B6B",
    },
    {
      name: "Running Club",
      date: "2025-11-12",
      icon: <Activity size={24} />,
      color: "#4ECDC4",
    },
    {
      name: "Nutrition Workshop",
      date: "2025-11-15",
      icon: <Apple size={24} />,
      color: "#FFD93D",
    },
  ];

  return <Calendar courses={courses} />;
}
