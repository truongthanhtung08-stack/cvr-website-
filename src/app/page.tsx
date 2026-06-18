import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedListings from "@/components/FeaturedListings";
import ProjectsSection from "@/components/ProjectsSection";
import LocationGrid from "@/components/LocationGrid";
import NewsSection from "@/components/NewsSection";
import AppDownload from "@/components/AppDownload";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Reveal>
          <FeaturedListings />
        </Reveal>
        <Reveal>
          <ProjectsSection />
        </Reveal>
        <Reveal>
          <LocationGrid />
        </Reveal>
        <Reveal>
          <NewsSection />
        </Reveal>
        <Reveal>
          <AppDownload />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
