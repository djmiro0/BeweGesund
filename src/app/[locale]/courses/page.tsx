/* eslint-disable react/jsx-key */
"use client";

import { useTranslations } from "next-intl";
import styles from "./Courses.module.css";
import { Dumbbell, Leaf, Car } from "lucide-react";

export default function CoursesPage() {
  const t = useTranslations("courses");

  // Lucide icons for each course (matching order)
  const icons = [<Car size={42} />, <Dumbbell size={42} />, <Leaf size={42} />];

  const plans = t.raw("plans"); // get array from JSON

  return (
    <section className={styles.coursesSection}>
      <h1 className={styles.title}>{t("title")}</h1>

      <div className={styles.courseGrid}>
        {plans.map((plan: any, index: number) => (
          <div key={index} className={styles.courseCard}>
            <div className={styles.icon}>{icons[index]}</div>
            <h2 className={styles.name}>{plan.name}</h2>
            <p className={styles.description}>{plan.description}</p>
            <div className={styles.price}>{plan.price}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
