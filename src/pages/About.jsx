import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = () => {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <h1>About AI Interviewer</h1>
              <p className="subtitle">Empowering developers to succeed in technical interviews</p>
            </div>
          </div>
        </section>

        <section className="container">
          <div className="content-section">
            <h2>Our Mission</h2>
            <p>
              AI Interviewer is designed to help software developers practice and excel in
              technical interviews through structured, interactive coding challenges.
            </p>
            <p>
              We provide a comprehensive platform with real-world coding problems, detailed
              analytics, and personalized feedback to help you improve your skills.
            </p>
          </div>

          <div className="content-section">
            <h2>Key Features</h2>
            <ul className="feature-list">
              <li><i className="fa-solid fa-check"></i> 75+ curated coding problems from NeetCode</li>
              <li><i className="fa-solid fa-check"></i> Real-time code editor with syntax highlighting</li>
              <li><i className="fa-solid fa-check"></i> Timed practice sessions</li>
              <li><i className="fa-solid fa-check"></i> Detailed progress tracking and analytics</li>
              <li><i className="fa-solid fa-check"></i> Smart hint system</li>
              <li><i className="fa-solid fa-check"></i> Multiple difficulty levels</li>
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default About;
