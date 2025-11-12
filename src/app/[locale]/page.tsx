'use client'

import Section from "../components/Section/Section";
import BannerSection from "../components/BannerSection/BannerSection";

export default function HomePage() {


  return (
    <>
      <main>
        <BannerSection />
        <Section id="courses" />
        <Section id="community" reverse />
        <Section id="nutrition" />
      </main>
    </>
  );
}
