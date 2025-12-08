import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <h1>Master Technical Interviews with AI</h1>
              <p className="subtitle">
                Practice coding problems, track your progress, and ace your next interview
              </p>
              <div className="hero-actions">
                <Link to="/signup" className="btn primary">
                  Get Started Free
                </Link>
                <Link to="/about" className="btn">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="container">
            <h2 className="section-title">Why Choose AI Interviewer?</h2>
            <div className="card-grid">
              <div className="card">
                <i className="fa-solid fa-code"></i>
                <h3>Practice Coding</h3>
                <p>Access curated coding problems from NeetCode 75 and custom challenges</p>
              </div>
              <div className="card">
                <i className="fa-solid fa-chart-line"></i>
                <h3>Track Progress</h3>
                <p>Monitor your improvement with detailed analytics and performance metrics</p>
              </div>
              <div className="card">
                <i className="fa-solid fa-clock"></i>
                <h3>Timed Sessions</h3>
                <p>Simulate real interview conditions with customizable time limits</p>
              </div>
              <div className="card">
                <i className="fa-solid fa-lightbulb"></i>
                <h3>Smart Hints</h3>
                <p>Get progressive hints and solutions when you need guidance</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <h2>Ready to Start Practicing?</h2>
            <p>Join thousands of developers improving their interview skills</p>
            <Link to="/signup" className="btn primary">
              Sign Up Now
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;
