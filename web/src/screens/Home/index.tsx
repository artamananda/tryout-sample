import React, { useState, useEffect } from 'react';
import { Navigation } from '../../components/Home/Navigation';
import { Header } from '../../components/Home/Header';
import { Features } from '../../components/Home/Features';
import { About } from '../../components/Home/About';
import { Services } from '../../components/Home/Services';
import { Gallery } from '../../components/Home/Galery';
import { Testimonials } from '../../components/Home/Testimonial';
import { Team } from '../../components/Home/Team';
import { Contact } from '../../components/Home/Contact';
import JsonData from '../../constants/data.json';
import SmoothScroll from 'smooth-scroll';
import './Home.css';
import ScrollToHash from '../../components/Home/ScrollToHash';

export const scroll = new SmoothScroll('a[href*="#"]', {
  speed: 1000,
  speedAsDuration: true
});

const HomeScreen = () => {
  const [landingPageData, setLandingPageData] = useState<any>({});
  useEffect(() => {
    setLandingPageData(JsonData);
  }, []);

  return (
    <div>
      <ScrollToHash />
      <Navigation />
      <Header data={landingPageData.Header} />
      <Features targetDate="2025-11-20 00:00:00" />
      <About data={landingPageData.About} />
      <Services data={landingPageData.Services} />
      <Gallery data={landingPageData.Gallery} />
      <Testimonials data={landingPageData.Testimonials} />
      <Team data={landingPageData.Team} />
      <Contact data={landingPageData.Contact} />
    </div>
  );
};

export default HomeScreen;
