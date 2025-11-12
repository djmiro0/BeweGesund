"use client";
import { JSX, useState } from "react";
import styles from "./Calendar.module.css";
import { CourseModal } from "../CourseModal/CourseModal";

interface Course {
  id: string;
  name: string;
  date: string;
  time: string;
  zoomLink: string;
  icon: JSX.Element;
  color: string;
  description?: string;
}

interface CalendarProps {
  courses: Course[];
}

export const Calendar: React.FC<CalendarProps> = ({ courses }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Group by day
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
                    <a
                      href={c.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} // prevents modal open when clicking Zoom link
                      className={styles.zoomLink}
                    >
                      Join on Zoom
                    </a>
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
};
