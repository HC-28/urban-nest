import { Link } from "react-router-dom";
import "../styles/Footer.css";
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiMail, FiPhone, FiMapPin } from "react-icons/fi";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-inner">
          {/* Company Info */}
          <div className="footer-section about">
            <h3 className="footer-logo">🏠 RealEstateIndia</h3>
            <p>India's leading real estate platform connecting buyers, sellers, and agents. Find your dream property from our extensive collection of verified listings.</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><FiFacebook /></a>
              <a href="#" aria-label="Twitter"><FiTwitter /></a>
              <a href="#" aria-label="Instagram"><FiInstagram /></a>
              <a href="#" aria-label="LinkedIn"><FiLinkedin /></a>
              <a href="#" aria-label="YouTube"><FiYoutube /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/properties">Buy Property</Link></li>
              <li><Link to="/properties?type=rent">Rent Property</Link></li>
              <li><Link to="/properties?type=commercial">Commercial</Link></li>
              <li><Link to="/agents">Find Agents</Link></li>
              <li><Link to="/post-property">Post Property</Link></li>
            </ul>
          </div>

          {/* Popular Cities */}
          <div className="footer-section">
            <h4>Popular Cities</h4>
            <ul>
              <li><Link to="/properties?city=mumbai">Mumbai</Link></li>
              <li><Link to="/properties?city=delhi">Delhi NCR</Link></li>
              <li><Link to="/properties?city=bangalore">Bangalore</Link></li>
              <li><Link to="/properties?city=hyderabad">Hyderabad</Link></li>
              <li><Link to="/properties?city=pune">Pune</Link></li>
              <li><Link to="/properties?city=chennai">Chennai</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section contact">
            <h4>Contact Us</h4>
            <div className="contact-item">
              <FiMapPin />
              <span>321 Nilkanth Business-Hub Katargam , Surat-395004</span>
            </div>
            <div className="contact-item">
              <FiPhone />
              <span>+91 9408146236 (Toll Free)</span>
            </div>
            <div className="contact-item">
              <FiMail />
              <span>support@realestateindia.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-inner">
          <p>© {new Date().getFullYear()} RealEstateIndia. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/sitemap">Sitemap</Link>
            <Link to="/help">Help</Link>
            <Link to="/feedback">Feedback</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

