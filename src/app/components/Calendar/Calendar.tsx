"use client";
import { JSX } from "react";
import styles from "./Calendar.module.css";

interface Course {
  name: string;
  date: string; // ISO string
  icon: JSX.Element;
  color: string;
}

interface CalendarProps {
  courses: Course[];
}

export const Calendar: React.FC<CalendarProps> = ({ courses }) => {
  // Group courses by date
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
      <h2 className={styles.title}>Available Courses</h2>
      <div className={styles.calendarGrid}>
        {days.map((day) => (
          <div key={day} className={styles.calendarDay}>
            <div className={styles.dateHeader}>{day}</div>
            <div className={styles.courses}>
              {grouped[day].map((c, idx) => (
                <div
                  key={idx}
                  className={styles.courseCard}
                  style={{ backgroundColor: c.color }}
                  onClick={() => alert(`Course: ${c.name}`)}
                >
                  <div className={styles.icon}>{c.icon}</div>
                  <div className={styles.name}>{c.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
