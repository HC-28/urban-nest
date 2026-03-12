import { Link } from "react-router-dom";
import "../styles/Footer.css";
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiMail, FiPhone, FiMapPin } from "react-icons/fi";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-inner">
          {/* Company Info */}
          <div className="footer-col footer-brand">
            <h3>Urban Nest</h3>
            <p className="footer-description">
              India's leading real estate platform connecting buyers, sellers, and agents. Find your dream property from our extensive collection of verified listings.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook"><FiFacebook /></a>
              <a href="#" className="social-link" aria-label="Twitter"><FiTwitter /></a>
              <a href="#" className="social-link" aria-label="Instagram"><FiInstagram /></a>
              <a href="#" className="social-link" aria-label="LinkedIn"><FiLinkedin /></a>
              <a href="#" className="social-link" aria-label="YouTube"><FiYoutube /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul className="footer-links-list">
              <li><Link to="/properties">Buy Property</Link></li>
              <li><Link to="/properties?type=rent">Rent Property</Link></li>
              <li><Link to="/properties?type=commercial">Commercial</Link></li>
              <li><Link to="/agents">Find Agents</Link></li>
              <li><Link to="/post-property">Post Property</Link></li>
            </ul>
          </div>

          {/* Popular Cities */}
          <div className="footer-col">
            <h4>Popular Cities</h4>
            <ul className="footer-links-list">
              <li><Link to="/properties?city=Ahmedabad">Ahmedabad</Link></li>
              <li><Link to="/properties?city=Mumbai">Mumbai</Link></li>
              <li><Link to="/properties?city=Bangalore">Bangalore</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-col contact-col">
            <h4>Contact Us</h4>
            <div className="contact-item">
              <FiMapPin className="contact-icon" />
              <span>123 Business Park, Andheri East, Mumbai 400069</span>
            </div>
            <div className="contact-item">
              <FiPhone className="contact-icon" />
              <span>+91 1800-123-4567</span>
            </div>
            <div className="contact-item">
              <FiMail className="contact-icon" />
              <span>support@urbannest.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© {new Date().getFullYear()} Urban Nest. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

