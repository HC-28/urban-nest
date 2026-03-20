import React, { useState, useEffect } from "react";
/* ─── SVG Icons ─── */
const DollarSignIcon = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const PercentIcon = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <line x1="19" y1="5" x2="5" y2="19"></line>
    <circle cx="17" cy="17" r="3"></circle>
    <circle cx="7" cy="7" r="3"></circle>
  </svg>
);

const CalendarIcon = ({ size = 18, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const MortgageCalculator = ({ propertyPrice }) => {
  const [principal, setPrincipal] = useState(propertyPrice || 5000000); // Default ₹50L
  const [downPayment, setDownPayment] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTerm, setLoanTerm] = useState(20);
  const [emi, setEmi] = useState(0);

  useEffect(() => {
    // EMI Calculation Formula: P x R x (1+R)^N / [(1+R)^N-1]
    const currentPrincipal = principal - (principal * (downPayment / 100));
    const monthlyInterestRatio = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    if (currentPrincipal > 0 && monthlyInterestRatio > 0 && numberOfPayments > 0) {
      const top = Math.pow(1 + monthlyInterestRatio, numberOfPayments);
      const bottom = top - 1;
      const calculatedEmi = (currentPrincipal * monthlyInterestRatio * top) / bottom;
      setEmi(Math.round(calculatedEmi));
    } else {
      setEmi(0);
    }
  }, [principal, downPayment, interestRate, loanTerm]);

  return (
    <div className="mortgage-calculator agent-card" style={{ marginTop: "24px" }}>
      <h4 style={{ marginBottom: "16px", color: "var(--text-secondary)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Mortgage Calculator
      </h4>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Principal Input */}
        <div>
          <label style={{ fontSize: "0.85rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Property Price (₹)</label>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <DollarSignIcon style={{ color: "#64748b", marginRight: "8px" }} />
            <input 
              type="number" 
              value={principal} 
              onChange={(e) => setPrincipal(Number(e.target.value))}
              style={{ background: "transparent", border: "none", color: "white", width: "100%", outline: "none", fontSize: "0.95rem" }}
            />
          </div>
        </div>

        {/* Down Payment Input */}
        <div>
          <label style={{ fontSize: "0.85rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Down Payment (%)</label>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <FiPercent style={{ color: "#64748b", marginRight: "8px" }} />
            <input 
              type="number" 
              value={downPayment} 
              onChange={(e) => setDownPayment(Number(e.target.value))}
              style={{ background: "transparent", border: "none", color: "white", width: "100%", outline: "none", fontSize: "0.95rem" }}
            />
          </div>
        </div>

        {/* Interest Rate & Term Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "0.85rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Interest (%)</label>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <PercentIcon style={{ color: "#64748b", marginRight: "8px" }} />
              <input 
                type="number" 
                step="0.1"
                value={interestRate} 
                onChange={(e) => setInterestRate(Number(e.target.value))}
                style={{ background: "transparent", border: "none", color: "white", width: "100%", outline: "none", fontSize: "0.95rem" }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Term (Years)</label>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <CalendarIcon style={{ color: "#64748b", marginRight: "8px" }} />
              <input 
                type="number" 
                value={loanTerm} 
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                style={{ background: "transparent", border: "none", color: "white", width: "100%", outline: "none", fontSize: "0.95rem" }}
              />
            </div>
          </div>
        </div>

        {/* Result */}
        <div style={{ marginTop: "16px", padding: "16px", background: "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(29,78,216,0.1))", borderRadius: "12px", border: "1px solid rgba(59,130,246,0.2)", textAlign: "center" }}>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "4px" }}>Estimated Monthly EMI</p>
          <h3 style={{ color: "#60a5fa", fontSize: "1.8rem", margin: 0 }}>
            ₹{emi.toLocaleString('en-IN')}
          </h3>
          <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px" }}>
            Principal amount: ₹{(principal * (1 - downPayment/100)).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;
