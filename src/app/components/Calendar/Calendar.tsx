"use client";
import React, { JSX } from "react";

interface Course {
  name: string;
  date: string; // ISO string
  icon: JSX.Element;
  color: string;
}

interface KursCalendarProps {
  courses: Course[];
}

export const KursCalendar: React.FC<KursCalendarProps> = ({ courses }) => {
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
    <div className="custom-calendar">
      {days.map((day) => (
        <div key={day} className="calendar-day">
          <div className="calendar-date">{day}</div>
          <div className="courses">
            {grouped[day].map((c, idx) => (
              <div
                key={idx}
                className="course-card"
                style={{ backgroundColor: c.color }}
                onClick={() => alert(`Course: ${c.name}`)}
              >
                {c.icon}
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
