"use client";

import { JSX, useState } from "react";
import styles from "./Calendar.module.css";
import { CourseModal } from "@/app/components/CourseModal/CourseModal";
import { useTranslations } from "next-intl";
import { Dumbbell, Activity, Apple } from "lucide-react"; 

interface Course {
  id: string;
  name: string;
  date: string;
  time?: string;
  zoomLink?: string;
  icon: JSX.Element;
  color: string;
  description?: string;
}

// This is the actual page component
export default function CalendarPage() {
  const t = useTranslations("calendar");

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Hardcoded courses (you can later fetch from API)
  const courses: Course[] = [
    {
      id: "1",
      name: "Strength Training",
      date: "2025-11-10",
      time: "10:00",
      zoomLink: "#",
      icon: <Dumbbell size={24} />,
      color: "#FF6B6B",
      description: "Build muscle and endurance with guided strength training."
    },
    {
      id: "2",
      name: "Running Club",
      date: "2025-11-12",
      time: "18:00",
      zoomLink: "#",
      icon: <Activity size={24} />,
      color: "#4ECDC4",
      description: "Join our running sessions to improve stamina and cardiovascular health."
    },
    {
      id: "3",
      name: "Nutrition Workshop",
      date: "2025-11-15",
      time: "14:00",
      zoomLink: "#",
      icon: <Apple size={24} />,
      color: "#FFD93D",
      description: "Learn tips and tricks for healthy eating and balanced nutrition."
    }
  ];

  // Group courses by day
  const grouped: Record<string, Course[]> = {};
  courses.forEach((c) => {
    const day = new Date(c.date).toDateString();
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(c);
  });

  const days = Object.keys(grouped).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className={styles.calendarContainer}>
      <h2 className={styles.title}>{t("courses")}</h2>
      <div className={styles.calendarGrid}>
        {days.map((day) => (
          <div key={day} className={styles.calendarDay}>
            <div className={styles.dateHeader}>{day}</div>
            <div className={styles.courses}>
              {grouped[day].map((c) => (
                <div
                  key={c.id}
                  className={styles.courseCard}
                  style={{ backgroundColor: c.color }}
                  onClick={() => setSelectedCourse(c)}
                >
                  <div className={styles.icon}>{c.icon}</div>
                  <div className={styles.courseInfo}>
                    <div className={styles.name}>{c.name}</div>
                    <div className={styles.time}>{c.time}</div>
                    {c.zoomLink && (
                      <a
                        href={c.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()} // prevent modal open
                        className={styles.zoomLink}
                      >
                        {t("zoom")}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
}
