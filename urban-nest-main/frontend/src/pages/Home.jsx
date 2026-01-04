import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "../styles/Home.css";
import heroBg from "../assets/re-back.jpg";
import ahmImg from "../assets/ahm.jpg";
import gurgaonImg from "../assets/gurgaon.jpg";
import mumbaiImg from "../assets/Mumbai.jpeg";
import puneImg from "../assets/Pune.jpg";
import delhiImg from "../assets/delhi.jpg";

/* ---------------- HERO SECTION ---------------- */
function Hero() {
  const [textColor, setTextColor] = useState("#000");

  useEffect(() => {
    const img = new Image();
    img.src = heroBg;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
      let r = 0, g = 0, b = 0, count = 0;

      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
        count++;
      }

      r = r / count;
      g = g / count;
      b = b / count;

      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      setTextColor(brightness > 128 ? "#000" : "#fff");
    };
  }, []);

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `url(${heroBg})`
      }}
    >
      <div className="hero-overlay"></div>

      <div className="hero-inner">
        <h1 style={{ color: textColor }}>Explore Buy / Sell / Rent Property in India</h1>

        <div className="hero-search">
          <div className="tabs">
            <button className="tab">Buy</button>
            <button className="tab">Rent / PG</button>
            <button className="tab">Projects</button>
            <button className="tab">Commercial</button>
            <button className="tab">Dealers</button>
          </div>

          <div className="search-row">
            <select className="type-select">
              <option>All Residential</option>
              <option>2 BHK</option>
              <option>3 BHK</option>
            </select>

            <input
              className="search-input"
              placeholder="Search City"
            />

            <button className="search-btn">Search</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FEATURE BOX ---------------- */
function FeatureBox({ title, cta }) {
  return (
    <div className="feature-box">
      <h4>{title}</h4>
      <button className="explore-btn">{cta}</button>
    </div>
  );
}

/* ---------------- CITY CIRCLE ---------------- */
function CityCircle({ city, count, image }) {
  return (
    <div className="city-item">
      <div className="city-pic" style={{ backgroundImage: image ? `url(${image})` : 'none' }}></div>
      <div className="city-name">{city}</div>
      <div className="city-count">{count}+ Properties</div>
    </div>
  );
}

/* ---------------- MAIN HOME ---------------- */
export default function Home() {
  const features = [
    { title: "Post Your Property Ads for Free !!", cta: "List Your Property" },
    { title: "Top Real Estate Agents & Property Dealers in India", cta: "Explore Now" },
    { title: "Explore India's Top Residential Cities List", cta: "Explore Now" },
    { title: "Helping you to find your dream Property", cta: "Post Your Requirement" },
  ];

  const cities = [
    { city: "Bangalore", count: 35419, image: ahmImg },
    { city: "Gurgaon", count: 34395, image: gurgaonImg },
    { city: "Mumbai", count: 33387, image: mumbaiImg },
    { city: "New Delhi", count: 31814, image: delhiImg },
    { city: "Pune", count: 29152, image: puneImg },
    { city: "Lucknow", count: 25437, image: ahmImg },
  ];

  return (
    <div>
      <Navbar />

      <Hero />

      <section className="features">
        <div className="features-inner">
          {features.map((f, i) => (
            <FeatureBox key={i} {...f} />
          ))}
        </div>
      </section>

      <section className="cities">
        <h3>Find Your Property in Your Preferred City</h3>

        <div className="cities-grid">
          {cities.map((c, i) => (
            <CityCircle key={i} {...c} />
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>© RealEstateIndia - Demo</div>
          <div>Contact: info@realestate.local</div>
        </div>git commit -m "Add gitignore"
      </footer>
    </div>
  );
}
