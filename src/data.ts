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

export const memberDashboard = {
    package: "rehab-plus" as MemberPackage,
    upcomingCourseIds: ["pilates-beginners", "rehab-back", "nutrition-principles"],
    completedCourseIds: ["morning-exercise", "active-break"],
    recommendedCourseIds: ["rehab-knee", "core-back-foundation", "full-body-rehab"],
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
                durationMinutes: 45,
                formatKey: "training",
                coach: "Sandra",
                packageRequired: "starter",
            },
            {
                id: "mon-2",
                titleKey: "core-back-foundation",
                startsAt: "2026-05-25T18:30:00",
                durationMinutes: 50,
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
                durationMinutes: 45,
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
                titleKey: "rehab-back",
                startsAt: "2026-05-27T09:00:00",
                durationMinutes: 50,
                formatKey: "training",
                coach: "Sandra",
                packageRequired: "rehab-plus",
            },
            {
                id: "wed-2",
                titleKey: "full-body-rehab",
                startsAt: "2026-05-27T18:00:00",
                durationMinutes: 55,
                formatKey: "training",
                coach: "Sandra",
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
                titleKey: "educational-seminars",
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
                titleKey: "rehab-knee",
                startsAt: "2026-05-29T17:00:00",
                durationMinutes: 45,
                formatKey: "training",
                coach: "Sandra",
                packageRequired: "rehab-plus",
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
