import { useState, useMemo } from "react";
import "./App.css";

// Realistic Seeded Data with Invoice (IV) details for 3-Way Match
const initialPOs = [
  { 
    id: "PO1001", supplier: "ABC Metals", material: "Steel Rod", 
    poQty: 100, grQty: 100, invQty: 100, 
    poPrice: 500, grPrice: 500, invPrice: 500, 
    sapStatus: "Matched", exception: "None"
  },
  { 
    id: "PO1002", supplier: "XYZ Ltd", material: "Copper Wire", 
    poQty: 200, grQty: 160, invQty: 160, 
    poPrice: 250, grPrice: 250, invPrice: 250, 
    sapStatus: "Blocked for Invoice Verification", exception: "GR-Shortage" // GR variance
  },
  { 
    id: "PO1003", supplier: "Global Parts", material: "Bolts", 
    poQty: 500, grQty: 500, invQty: 550, 
    poPrice: 10, grPrice: 10, invPrice: 10, 
    sapStatus: "Blocked for Invoice Verification", exception: "Invoice Overshipment" // IV > GR
  },
  { 
    id: "PO1004", supplier: "Prime Supplies", material: "Bearings", 
    poQty: 100, grQty: 100, invQty: 100, 
    poPrice: 750, grPrice: 750, invPrice: 800, 
    sapStatus: "Blocked for Invoice Verification", exception: "Price Variance" // IV Price > PO Price
  },
  { 
    id: "PO1005", supplier: "Tech Components", material: "Sensors", 
    poQty: 50, grQty: 50, invQty: 50, 
    poPrice: 1200, grPrice: 1200, invPrice: 1200, 
    sapStatus: "Matched", exception: "None"
  },
  // Edge case for Rule 1 (Over-delivery)
  { 
    id: "PO1006", supplier: "Edge Corp", material: "Gloves", 
    poQty: 100, grQty: 120, invQty: 120, 
    poPrice: 20, grPrice: 20, invPrice: 20, 
    sapStatus: "Blocked for Invoice Verification", exception: "GR Over-Delivery"
  },
];

export default function App() {
  const [poList, setPoList] = useState(initialPOs);
  const [selectedPO, setSelectedPO] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --- KPI CALCULATIONS ---
  const totalPOs = poList.length;
  const exceptions = poList.filter(po => po.sapStatus !== "Matched").length;
  const matchRate = Math.round(((totalPOs - exceptions) / totalPOs) * 100);
  const avgResolution = "2.4 days"; 

  // --- SEARCH & FILTER ---
  const filteredPOs = useMemo(() => {
    return poList.filter(po => {
      const matchesSearch = po.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            po.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === "All" ? true : po.exception === filter;
      return matchesSearch && matchesFilter;
    });
  }, [poList, searchTerm, filter]);

  // --- DATA GROUNDED AI (3-WAY MATCH ANALYZER) ---
  const getAIAnalysis = (po) => {
    let summary = "";
    let risk = "";

    const grQtyDiff = po.grQty - po.poQty;
    const invQtyDiff = po.invQty - po.grQty;
    const priceDiff = po.invPrice - po.poPrice;

    if (po.sapStatus === "Matched") {
      summary = `3-Way Match successful for PO ${po.id}. PO, GR, and Invoice (${po.invQty} units @ ₹${po.invPrice}) are perfectly aligned. No action required.`;
      risk = "🟢 LOW";
    } 
    else if (po.exception === "GR-Shortage") {
      summary = `3-Way Match blocked. PO: ${po.poQty} units, GR: ${po.grQty} units. Invoice matches GR (${po.invQty} units) but is short against PO by ${po.poQty - po.grQty} units. Recommend requesting supplier clarification before approving invoice for payment.`;
      risk = "🔴 HIGH";
    }
    else if (po.exception === "Invoice Overshipment") {
      summary = `3-Way Match blocked. PO: ${po.poQty}, GR: ${po.grQty}, Invoice: ${po.invQty}. Invoice exceeds GR by ${po.invQty - po.grQty} units. Standard SAP rule blocks over-invoicing. Recommend escalating to AP to flag duplicate or incorrect billing.`;
      risk = "🔴 HIGH";
    }
    else if (po.exception === "Price Variance") {
      summary = `3-Way Match blocked. PO Price: ₹${po.poPrice}, Invoice Price: ₹${po.invPrice}. Price variance of ₹${po.invPrice - po.poPrice}/unit detected. Potential overbilling of ₹${(po.invPrice - po.poPrice) * po.invQty}. Recommend blocking invoice and escalating to procurement.`;
      risk = "🔴 HIGH";
    }
    else if (po.exception === "GR Over-Delivery") {
      summary = `3-Way Match blocked. GR over-delivery of ${po.grQty - po.poQty} units detected. SAP does not allow GR to exceed PO quantity. Validation required before processing invoice.`;
      risk = "🟡 MEDIUM";
    }

    return { summary, risk };
  };

  // --- VALIDATION LOGIC (SAP BUSINESS RULES) ---
  const handleDecision = (action) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedPO) return;

    if (selectedPO.processed) {
      setErrorMessage("This purchase order has already been processed.");
      return;
    }

    // Rule 1: GR > PO
    if (selectedPO.grQty > selectedPO.poQty) {
      setErrorMessage("Validation Failed: Goods Receipt quantity cannot exceed Purchase Order quantity.");
      return;
    }

    // Rule 2: Negative Quantity
    if (selectedPO.grQty < 0 || selectedPO.invQty < 0) {
      setErrorMessage("Validation Failed: Quantity must be greater than or equal to 0.");
      return;
    }

    // Rule 3: Invoice Price > PO Price (SAP Tolerance Check)
    if (selectedPO.invPrice > selectedPO.poPrice) {
      setErrorMessage("Validation Failed: Invoice price exceeds PO price. Must escalate to manager.");
      return;
    }

    // Pass validation, update status to SAP-like status
    setPoList(prev => prev.map(po => 
      po.id === selectedPO.id ? { ...po, sapStatus: action, processed: true } : po
    ));
    setSelectedPO(prev => ({ ...prev, sapStatus: action, processed: true }));
    setSuccessMessage(`Decision recorded: ${action} for ${selectedPO.id}`);
  };

  const getStatusIcon = (status) => {
    if (status === "Matched") return "🟢";
    return "🔴";
  };

  return (
    <div className="app-container">
      <header className="dashboard-header">
        <h1>PROCUREMENT EXCEPTION COCKPIT</h1>
        <p>3-Way Match Monitoring (PO → GR → Invoice)</p>
      </header>

      {/* KPI SECTION */}
      <div className="kpi-cards">
        <div className="kpi-card"><span className="kpi-label">Total POs</span><span className="kpi-value">{totalPOs}</span></div>
        <div className="kpi-card"><span className="kpi-label">Exceptions</span><span className="kpi-value red">{exceptions}</span></div>
        <div className="kpi-card"><span className="kpi-label">Match Rate</span><span className="kpi-value success">{matchRate}%</span></div>
        <div className="kpi-card"><span className="kpi-label">Avg Resolution</span><span className="kpi-value">{avgResolution}</span></div>
      </div>

      {/* MESSAGES */}
      {errorMessage && <div className="error-alert">{errorMessage}</div>}
      {successMessage && <div className="success-alert">{successMessage}</div>}

      {/* SEARCH & FILTER */}
      <div className="controls">
        <input 
          type="text" 
          placeholder="Search PO / Supplier" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="GR-Shortage">GR Shortage</option>
          <option value="Invoice Overshipment">Invoice Overshipment</option>
          <option value="Price Variance">Price Variance</option>
          <option value="GR Over-Delivery">GR Over-Delivery</option>
        </select>
      </div>

      <div className="main-layout">
        {/* MAIN TABLE */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>PO</th>
                <th>Supplier</th>
                <th>PO Qty</th>
                <th>GR Qty</th>
                <th>Inv Qty</th>
                <th>SAP Status</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.map(po => (
                <tr key={po.id} onClick={() => { setSelectedPO(po); setErrorMessage(""); setSuccessMessage(""); }} className={selectedPO?.id === po.id ? "active-row" : ""}>
                  <td>{po.id}</td>
                  <td>{po.supplier}</td>
                  <td>{po.poQty}</td>
                  <td>{po.grQty}</td>
                  <td>{po.invQty}</td>
                  <td className={po.sapStatus !== "Matched" ? "status-blocked" : "status-matched"}>{po.sapStatus}</td>
                  <td>{getStatusIcon(po.sapStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DETAIL DECISION SCREEN */}
        <div className="right-panel">
          {selectedPO ? (
            <div className="details-box">
              <h2>{selectedPO.id} — {selectedPO.supplier.toUpperCase()}</h2>
              
              <div className="details-grid-3">
                <div className="detail-item"><span>PO Qty / Price</span><strong>{selectedPO.poQty} / ₹{selectedPO.poPrice}</strong></div>
                <div className="detail-item"><span>GR Qty / Price</span><strong className={selectedPO.grQty !== selectedPO.poQty ? "text-red" : ""}>{selectedPO.grQty} / ₹{selectedPO.grPrice}</strong></div>
                <div className="detail-item"><span>Invoice Qty / Price</span><strong className={selectedPO.invQty !== selectedPO.grQty || selectedPO.invPrice !== selectedPO.poPrice ? "text-red" : ""}>{selectedPO.invQty} / ₹{selectedPO.invPrice}</strong></div>
              </div>

              {/* AI ANALYSIS SECTION */}
              <div className="ai-box">
                <h4>🤖 AI 3-WAY MATCH ANALYSIS</h4>
                <p>{getAIAnalysis(selectedPO).summary}</p>
                <p className="risk-level">Risk Level: {getAIAnalysis(selectedPO).risk}</p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="action-buttons">
                <button className="btn btn-approve" onClick={() => handleDecision("Approved")}>Approve Invoice Verification</button>
                <button className="btn btn-clarify" onClick={() => handleDecision("Clarification")}>Request Supplier Clarification</button>
                <button className="btn btn-escalate" onClick={() => handleDecision("Escalated")}>Escalate to AP</button>
              </div>
            </div>
          ) : (
            <div className="placeholder">
              <span>👈</span>
              <h2>Select a PO</h2>
              <p>Click on a row to view 3-Way Match discrepancies and AI insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}