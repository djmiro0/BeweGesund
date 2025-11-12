"use client";
import styles from "./CourseModal.module.css";
import { JSX } from "react";

interface Course {
  id: string;
  name: string;
  date: string;
  time?: string;
  zoomLink?: string;
  icon?: JSX.Element;
  color: string;
  description?: string;
}

interface CourseModalProps {
  course: Course;
  onClose: () => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({ course, onClose }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
      >
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
        <h2>{course.name}</h2>
        <p>
          {course.date} – {course.time}
        </p>
        <p>{course.description}</p>
        <a
          href={course.zoomLink}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.joinBtn}
        >
          Join on Zoom
        </a>
      </div>
    </div>
  );
};
