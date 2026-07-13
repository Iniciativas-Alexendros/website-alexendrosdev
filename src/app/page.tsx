import { TESTIMONIALS } from "@/lib/content";
import { Terminal } from "@/components/sections/Terminal";
import { Marquee } from "@/components/sections/Marquee";
import { Icon } from "@/components/ui/Icon";
import { Hero } from "@/components/sections/home/Hero";
import { HomeProjects } from "@/components/sections/home/HomeProjects";
import { HomeServices } from "@/components/sections/home/HomeServices";
import { Testimonials } from "@/components/sections/home/Testimonials";
import { HomeCTA } from "@/components/sections/home/HomeCTA";

export default function HomePage() {
  return (
    <>
      <div className="ak-container">
        <Hero />
      </div>
      <div className="ak-term-band">
        <Terminal />
        <div className="ak-term-cap">
          <Icon name="terminal" size={14} />
          Terminal animada: typing en bucle + cursor parpadeante
        </div>
      </div>
      <div style={{ height: 36 }} />
      <Marquee />
      <div className="ak-container">
        <HomeProjects />
      </div>
      <HomeServices />
      {TESTIMONIALS.length > 0 && <Testimonials />}
      <HomeCTA />
    </>
  );
}
