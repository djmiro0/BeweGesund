"use client";
import { useSearchParams } from "next/navigation";
import { KursCalendar } from "../Calendar/Calendar";
import { FaDumbbell, FaRunning, FaAppleAlt } from "react-icons/fa";

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course"); // e.g. "kurse", "community", etc.

  const courses = [
    { name: "Strength Training", date: "2025-11-10", icon: <FaDumbbell />, color: "#FF6B6B" },
    { name: "Running Club", date: "2025-11-12", icon: <FaRunning />, color: "#4ECDC4" },
    { name: "Nutrition Workshop", date: "2025-11-15", icon: <FaAppleAlt />, color: "#FFD93D" },
  ];

  // Optional: scroll to or highlight the course that was clicked
  // For simplicity, you can filter courses by id or use CSS highlight

  return <KursCalendar courses={courses} />;
}
