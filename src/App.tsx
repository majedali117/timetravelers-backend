import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminRoutes from './admin/AdminRoutes';

// Import existing App components
import Hero from './components/Hero';
import About from './components/About';
import HowItWorks from './components/HowItWorks';
import TargetFields from './components/TargetFields';
import Advantages from './components/Advantages';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Render admin routes if path starts with /admin
  if (isAdminRoute) {
    return <AdminRoutes />;
  }

  // Otherwise render the main website
  return (
    <div className="App">
      <Hero />
      <About />
      <HowItWorks />
      <TargetFields />
      <Advantages />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}

export default App;
