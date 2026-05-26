// data.ts
import { Salad, Brain } from 'lucide-react';

export const contentText = {
    de: {
        nav: {
            home: "Home",
            videos: "Training",
            live: "Live Kurse",
            services: "Coaching & Ernährung",
            login: "Anmelden"
        },
        hero: {
            title: "EROBERE DEINEN KÖRPER",
            subtitle: "High-End Fitness im Herzen von Einbeck.",
            cta: "Jetzt Starten"
        },
        auth: {
            title: "Willkommen zurück",
            email: "E-Mail Adresse",
            pass: "Passwort",
            btn: "Einloggen",
            close: "Schließen"
        }
    }
};

// Simulacija podataka sa Contentful-a (Videos)
export const mockVideos = [
    { id: 1, title: "Full Body HIIT", duration: "25 Min", level: "Intensiv", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1000" },
    { id: 2, title: "Core & Abs", duration: "15 Min", level: "Mittel", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=1000" },
    { id: 3, title: "Yoga Flow", duration: "45 Min", level: "Anfänger", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=1000" },
];

// Simulacija Live Kalendara
export const mockSchedule = [
    { id: 1, day: "MO", date: "12. Okt", time: "18:00", title: "Power Lifting", spots: 3 },
    { id: 2, day: "MI", date: "14. Okt", time: "19:30", title: "Cardio Boxen", spots: 8 },
    { id: 3, day: "FR", date: "16. Okt", time: "17:00", title: "Mobility & Stretch", spots: 12 },
];

export const services = [
    {
        id: "nutrition",
        title: "Ernährung (Ishrana)",
        desc: "Maßgeschneiderte Ernährungspläne für maximale Leistung.",
        icon: Salad,
        cta: "Plan erstellen"
    },
    {
        id: "coaching",
        title: "Privat Coaching",
        desc: "1-zu-1 Mentoring und Mindset Coaching.",
        icon: Brain,
        cta: "Termin buchen"
    }
];

export type MemberPackage = "starter" | "rehab-plus" | "all-access";

export interface MemberCourseDefinition {
    id: string;
    categoryKey: string;
    durationMinutes?: number;
    unlocksPerWeek?: number;
    noteKey?: string;
    coach?: string;
    packageRequired: MemberPackage;
}

export interface MemberCourseCategory {
    id: string;
    courseIds: string[];
}

export interface MemberScheduleEntry {
    id: string;
    titleKey: string;
    startsAt: string;
    durationMinutes: number;
    formatKey: "training" | "seminar";
    coach: string;
    packageRequired: MemberPackage;
}

export interface MemberScheduleDay {
    id: string;
    date: string;
    entries: MemberScheduleEntry[];
}

export const memberCourses: MemberCourseDefinition[] = [
    { id: "reha-knee", categoryKey: "reha", durationMinutes: 30, unlocksPerWeek: 2, packageRequired: "rehab-plus" },
    { id: "reha-back", categoryKey: "reha", durationMinutes: 30, unlocksPerWeek: 2, packageRequired: "rehab-plus" },
    { id: "reha-hip", categoryKey: "reha", durationMinutes: 30, unlocksPerWeek: 2, packageRequired: "rehab-plus" },
    { id: "reha-general", categoryKey: "reha", durationMinutes: 30, unlocksPerWeek: 2, packageRequired: "rehab-plus" },
    { id: "osteoporosis-training", categoryKey: "reha", unlocksPerWeek: 1, packageRequired: "all-access" },
    { id: "arthritis-training", categoryKey: "reha", unlocksPerWeek: 1, packageRequired: "all-access" },
    { id: "morning-gymnastics", categoryKey: "healthy-living", durationMinutes: 15, unlocksPerWeek: 1, packageRequired: "starter" },
    { id: "evening-gymnastics", categoryKey: "healthy-living", durationMinutes: 10, unlocksPerWeek: 1, packageRequired: "starter" },
    { id: "pilates-beginners", categoryKey: "healthy-living", durationMinutes: 30, unlocksPerWeek: 1, noteKey: "package22", coach: "Nevena", packageRequired: "starter" },
    { id: "heart-gymnastics", categoryKey: "healthy-living", durationMinutes: 25, unlocksPerWeek: 1, packageRequired: "starter" },
    { id: "weight-loss-program", categoryKey: "overweight", durationMinutes: 35, unlocksPerWeek: 1, noteKey: "repeat2to3", packageRequired: "rehab-plus" },
    { id: "nutrition-principles", categoryKey: "overweight", noteKey: "videoAndDocs", packageRequired: "starter" },
    { id: "abs-intensive", categoryKey: "definition", durationMinutes: 30, unlocksPerWeek: 1, packageRequired: "all-access" },
    { id: "glutes-intensive", categoryKey: "definition", durationMinutes: 30, unlocksPerWeek: 1, packageRequired: "all-access" },
    { id: "full-body-strength-advanced", categoryKey: "definition", durationMinutes: 25, noteKey: "package22", coach: "Ivana", packageRequired: "all-access" },
    { id: "pelvic-floor", categoryKey: "pre-post-birth", durationMinutes: 20, unlocksPerWeek: 1, packageRequired: "starter" },
    { id: "birth-preparation", categoryKey: "pre-post-birth", packageRequired: "starter" },
    { id: "baby-training", categoryKey: "pre-post-birth", packageRequired: "starter" },
    { id: "active-break", categoryKey: "corporate-fitness", durationMinutes: 10, unlocksPerWeek: 1, noteKey: "repeatDaily", packageRequired: "starter" },
    { id: "nutrition-program", categoryKey: "paragraph-20", noteKey: "onlineOnly", packageRequired: "starter" },
];

export const memberCourseCategories: MemberCourseCategory[] = [
    { id: "reha", courseIds: ["reha-knee", "reha-back", "reha-hip", "reha-general", "osteoporosis-training", "arthritis-training"] },
    { id: "healthy-living", courseIds: ["morning-gymnastics", "evening-gymnastics", "pilates-beginners", "heart-gymnastics"] },
    { id: "overweight", courseIds: ["weight-loss-program", "nutrition-principles"] },
    { id: "definition", courseIds: ["abs-intensive", "glutes-intensive", "full-body-strength-advanced"] },
    { id: "pre-post-birth", courseIds: ["pelvic-floor", "birth-preparation", "baby-training"] },
    { id: "corporate-fitness", courseIds: ["active-break"] },
    { id: "paragraph-20", courseIds: ["nutrition-program"] },
];

export const memberDashboard = {
    package: "rehab-plus" as MemberPackage,
    upcomingCourseIds: ["pilates-beginners", "reha-back", "nutrition-principles"],
    completedCourseIds: ["morning-gymnastics", "active-break"],
    recommendedCourseIds: ["reha-knee", "weight-loss-program", "heart-gymnastics"],
};

export const activeScheduleDays: MemberScheduleDay[] = [
    {
        id: "mon",
        date: "2026-05-25",
        entries: [
            {
                id: "mon-1",
                titleKey: "pilates-beginners",
                startsAt: "2026-05-25T08:00:00",
                durationMinutes: 30,
                formatKey: "training",
                coach: "Nevena",
                packageRequired: "starter",
            },
            {
                id: "mon-2",
                titleKey: "reha-back",
                startsAt: "2026-05-25T18:30:00",
                durationMinutes: 30,
                formatKey: "training",
                coach: "Sandra",
                packageRequired: "rehab-plus",
            },
        ],
    },
    {
        id: "tue",
        date: "2026-05-26",
        entries: [
            {
                id: "tue-1",
                titleKey: "nutrition-principles",
                startsAt: "2026-05-26T17:30:00",
                durationMinutes: 35,
                formatKey: "seminar",
                coach: "Sandra",
                packageRequired: "starter",
            },
        ],
    },
    {
        id: "wed",
        date: "2026-05-27",
        entries: [
            {
                id: "wed-1",
                titleKey: "reha-knee",
                startsAt: "2026-05-27T09:00:00",
                durationMinutes: 30,
                formatKey: "training",
                coach: "Sandra",
                packageRequired: "rehab-plus",
            },
            {
                id: "wed-2",
                titleKey: "full-body-strength-advanced",
                startsAt: "2026-05-27T18:00:00",
                durationMinutes: 25,
                formatKey: "training",
                coach: "Ivana",
                packageRequired: "all-access",
            },
        ],
    },
    {
        id: "thu",
        date: "2026-05-28",
        entries: [
            {
                id: "thu-1",
                titleKey: "nutrition-program",
                startsAt: "2026-05-28T18:30:00",
                durationMinutes: 60,
                formatKey: "seminar",
                coach: "Sandra",
                packageRequired: "all-access",
            },
        ],
    },
    {
        id: "fri",
        date: "2026-05-29",
        entries: [
            {
                id: "fri-1",
                titleKey: "active-break",
                startsAt: "2026-05-29T12:00:00",
                durationMinutes: 10,
                formatKey: "training",
                coach: "Sandra",
                packageRequired: "starter",
            },
            {
                id: "fri-2",
                titleKey: "osteoporosis-training",
                startsAt: "2026-05-29T17:00:00",
                durationMinutes: 30,
                formatKey: "training",
                coach: "Sandra",
                packageRequired: "all-access",
            },
        ],
    },
];

// Mock user data
export const user =
    {
        id: 1,
        name: "Max Mustermann",
        email: "max@example.com",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        membership: "Premium",
        lastLogin: "2026-02-10T08:45:00Z",
        favorites: [1, 3], // IDs of favorite videos
        bookedClasses: [2], // IDs of scheduled classes
    }
