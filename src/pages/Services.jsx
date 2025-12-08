import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Services = () => {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <h1>Our Services</h1>
              <p className="subtitle">Everything you need to ace your technical interviews</p>
            </div>
          </div>
        </section>

        <section className="container">
          <div className="services-grid">
            <div className="service-card">
              <i className="fa-solid fa-laptop-code"></i>
              <h3>Practice Sessions</h3>
              <p>Customizable practice sessions with topic selection, difficulty levels, and time limits</p>
            </div>
            <div className="service-card">
              <i className="fa-solid fa-chart-bar"></i>
              <h3>Analytics Dashboard</h3>
              <p>Track your progress with detailed statistics and visual charts</p>
            </div>
            <div className="service-card">
              <i className="fa-solid fa-book"></i>
              <h3>Problem Library</h3>
              <p>Access to 75+ curated problems covering all major topics</p>
            </div>
            <div className="service-card">
              <i className="fa-solid fa-graduation-cap"></i>
              <h3>Learning Resources</h3>
              <p>Hints, solutions, and explanations for every problem</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Services;
