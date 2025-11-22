// src/pages/BudgetForm.js
// Import React library and the useState hook for managing component state
import React, { useState } from "react";
// Import the saveRequest function from our storage utility to save form data
import { saveRequest } from "../lib/storage";

// Define a constant array of month names for the dropdown selection
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// Build an empty event block
// This function creates a new event object with empty string values for all properties
function emptyEvent() {
  return {
    name: "",        // Event name (e.g., "Halaqah kickoff")
    date: "",        // Event date in yyyy-mm-dd format
    total: "",       // Total budget amount as string (converted to number later)
    breakdown: "",   // Detailed breakdown of expenses
    extraInfo: ""    // Additional information about the event
  };
}

// Main component function for the budget request form
export default function BudgetForm() {
  // State to track which step (1-7) of the form the user is currently on
  const [step, setStep] = useState(1);

  // State object to hold all form data across all sections
  const [form, setForm] = useState({
    // Section 1: Access control
    password: "",

    // Section 2: Basic information about the requester
    fullName: "",
    contact: "", // Email or WhatsApp number for contact
    city: "",    // City where the requester is located
    monthNeeded: "", // Month name when funds are needed (e.g., "January")

    // Section 3: Information about funding and recipient
    description: "",     // Optional description of how funds will be used
    recipientName: "",   // Name of person who will receive the funds
    mailingAddress: "", // Address where the cheque should be mailed

    // Sections 4-7: Up to 4 different events that need funding
    // Each event is initialized as an empty event object
    events: [emptyEvent(), emptyEvent(), emptyEvent(), emptyEvent()]
  });

  // Helper function to update a single field in the form state
  // Takes a field name and new value, updates the form state immutably
  function setField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  // Helper function to update a specific field of a specific event
  // idx: index of the event (0-3), name: field name, value: new value
  function setEventField(idx, name, value) {
    setForm(prev => {
      const copy = [...prev.events]; // Create a copy of the events array
      copy[idx] = { ...copy[idx], [name]: value }; // Update the specific field of the specific event
      return { ...prev, events: copy }; // Return new state with updated events array
    });
  }

  // --- Validation helpers per-step ---
  // Function to validate form data for each step
  // Returns error message string if validation fails, null if validation passes
  function validateStep(current) {
    // Simple, human-readable checks. Return string message on error, or null if OK.
    
    // Step 1: Validate password field
    if (current === 1) {
      if (!form.password.trim()) return "Password is required.";
      return null;
    }
    
    // Step 2: Validate basic requester information
    if (current === 2) {
      if (form.fullName.trim().length < 2) return "Full name is required.";
      if (form.contact.trim().length < 5) return "Please enter a valid email or WhatsApp number.";
      if (form.city.trim().length < 2) return "City is required.";
      if (!MONTHS.includes(form.monthNeeded)) return "Please choose the month in which funds are needed.";
      return null;
    }
    
    // Step 3: Validate funding information
    if (current === 3) {
      if (form.recipientName.trim().length < 2) return "Name of person to receive funds is required.";
      if (form.mailingAddress.trim().length < 5) return "Mailing address is required.";
      return null;
    }
    
    // Steps 4-7: Validate individual event information
    if (current >= 4 && current <= 7) {
      const idx = current - 4; // Convert step number to array index (0-3)
      const ev = form.events[idx]; // Get the event object for this step

      // Check if any field in the event has been filled
      // If event is entirely blank, it's allowed (user can skip extra pages)
      const anyFilled = Object.values(ev).some(v => (v ?? "").toString().trim() !== "");
      if (!anyFilled) return null;

      // If they started filling any field, enforce required fields for this event
      if (ev.name.trim().length < 2) return `Event #${idx + 1}: name is required.`;
      if (!ev.date) return `Event #${idx + 1}: date is required.`;
      const amt = parseFloat(ev.total); // Convert total to number for validation
      if (!Number.isFinite(amt) || amt <= 0) return `Event #${idx + 1}: total budget must be > 0.`;
      // breakdown is optional but recommended — we won't hard fail
      return null;
    }
    return null; // Default case: no validation needed
  }

  // Handler function for "Next" button click
  function handleNext() {
    const err = validateStep(step); // Validate current step before proceeding
    if (err) return alert(err); // Show error message if validation fails
    if (step < 7) setStep(step + 1); // Move to next step if not already on last step
  }

  // Handler function for "Back" button click
  function handleBack() {
    if (step > 1) setStep(step - 1); // Move to previous step if not already on first step
  }

  // Handler function for form submission
  function handleSubmit(e) {
    e.preventDefault(); // Prevent default form submission behavior
    
    // Validate all steps once more before final submission
    for (let s = 1; s <= 7; s++) {
      const err = validateStep(s);
      if (err) return alert(err); // Stop submission if any step has validation errors
    }

    // Build clean payload by processing and filtering events
    const cleanedEvents = form.events
      .map((ev, i) => {
        // Check if any field in this event has content
        const any = Object.values(ev).some(v => (v ?? "").toString().trim() !== "");
        if (!any) return null; // Skip completely empty events
        
        const totalFloat = parseFloat(ev.total); // Convert total to number
        return {
          index: i + 1, // Event number (1-4)
          name: ev.name.trim(), // Clean up whitespace from name
          date: ev.date, // Date in yyyy-mm-dd format
          totalCents: Math.round((Number.isFinite(totalFloat) ? totalFloat : 0) * 100), // Convert dollars to cents
          breakdown: ev.breakdown.trim(), // Clean up whitespace from breakdown
          extraInfo: ev.extraInfo.trim() // Clean up whitespace from extra info
        };
      })
      .filter(Boolean); // Remove null entries (empty events)

    // Calculate grand total in cents from all events
    const grandTotalCents = cleanedEvents.reduce((sum, ev) => sum + ev.totalCents, 0);

    // Build the final payload object to be saved
    const payload = {
      id: crypto.randomUUID(), // Generate unique ID for this request
      createdAt: new Date().toISOString(), // Timestamp when request was created

      // Section 1: Access control
      password: form.password.trim(), // You'll replace with real auth later

      // Section 2: Basic requester information
      fullName: form.fullName.trim(),
      contact: form.contact.trim(),
      city: form.city.trim(),
      monthNeeded: form.monthNeeded,

      // Section 3: Funding details
      description: form.description.trim(), // Optional description
      recipientName: form.recipientName.trim(),
      mailingAddress: form.mailingAddress.trim(),

      // Events and total amount
      events: cleanedEvents,
      amountCents: grandTotalCents // Keep compatibility with your list page
    };

    saveRequest(payload); // Save the request using our storage utility
    console.log("Budget Request (full):", payload); // Log the full request for debugging
    alert("Budget Request saved ✅"); // Show success message

    // Reset form to initial state after successful submission
    setStep(1); // Go back to first step
    setForm({
      password: "",
      fullName: "",
      contact: "",
      city: "",
      monthNeeded: "",
      description: "",
      recipientName: "",
      mailingAddress: "",
      events: [emptyEvent(), emptyEvent(), emptyEvent(), emptyEvent()] // Reset all events
    });
  }

  // --- UI per step ---
  // Main render function that returns the JSX for the component
  return (
    <div style={{ padding: 24 }}>
      <h2>YM Budget Request</h2>
      {/* Instructions paragraph with styling */}
      <p style={{ color: "#555", marginBottom: 16 }}>
        Please fill this form along with monthly planning <b>10 days before the start of the month</b> to receive funding for halaqat and events.
      </p>

      {/* Main form element with submit handler and max width styling */}
      <form onSubmit={handleSubmit} style={{ maxWidth: 680 }}>
        {/* Step indicator showing current section */}
        <div style={{ margin: "8px 0 16px", fontSize: 14, color: "#666" }}>
          Section {step} of 7
        </div>

        {/* Conditional rendering for Step 1: Access section */}
        {step === 1 && (
          <SectionCard title="Section 1 — Access">
            <p style={{ marginTop: 0 }}>
              This form is automatically collecting emails from all respondents.
            </p>
            {/* Password field with required indicator */}
            <label htmlFor="password">Enter the Password <span style={{color:"crimson"}}>*</span></label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={e => setField("password", e.target.value)} // Update password field in form state
              required
            />
          </SectionCard>
        )}

        {/* Conditional rendering for Step 2: Budget Request Basics */}
        {step === 2 && (
          <SectionCard title="Section 2 — Budget Request Basics">
            <p style={{ marginTop: 0 }}>
              Use this form to request a budget from YM Sisters Canada to buy materials, food and supplies for your events and halaqat.
              Please fill in this form at least 10 days before your funds are needed. Only YM City treasurers may complete this form.
              Questions? <a href="mailto:finance.chair@ymsisters.org">finance.chair@ymsisters.org</a>
            </p>

            {/* Full name input field */}
            <label htmlFor="fullName">Full name <span style={{color:"crimson"}}>*</span></label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={e => setField("fullName", e.target.value)} // Update fullName in form state
              required
            />

            {/* Contact information input field */}
            <label htmlFor="contact">Email or WhatsApp contact number <span style={{color:"crimson"}}>*</span></label>
            <input
              id="contact"
              type="text"
              value={form.contact}
              onChange={e => setField("contact", e.target.value)} // Update contact in form state
              required
            />

            {/* City input field */}
            <label htmlFor="city">City <span style={{color:"crimson"}}>*</span></label>
            <input
              id="city"
              type="text"
              value={form.city}
              onChange={e => setField("city", e.target.value)} // Update city in form state
              required
            />

            {/* Month selection dropdown */}
            <label htmlFor="monthNeeded">Month (in which funds are needed) <span style={{color:"crimson"}}>*</span></label>
            <select
              id="monthNeeded"
              value={form.monthNeeded}
              onChange={e => setField("monthNeeded", e.target.value)} // Update monthNeeded in form state
              required
            >
              <option value="">Select month</option>
              {/* Map through MONTHS array to create option elements */}
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </SectionCard>
        )}

        {/* Conditional rendering for Step 3: Funding Information */}
        {step === 3 && (
          <SectionCard title="Section 3 — Funding Information">
            {/* Optional description textarea */}
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={e => setField("description", e.target.value)} // Update description in form state
              placeholder="Short note about how funds will be used"
            />

            {/* Recipient name input field */}
            <label htmlFor="recipientName">Name of person to receive funds <span style={{color:"crimson"}}>*</span></label>
            <input
              id="recipientName"
              type="text"
              value={form.recipientName}
              onChange={e => setField("recipientName", e.target.value)} // Update recipientName in form state
              required
            />

            {/* Mailing address textarea */}
            <label htmlFor="mailingAddress">Address to mail cheque <span style={{color:"crimson"}}>*</span></label>
            <textarea
              id="mailingAddress"
              rows={3}
              value={form.mailingAddress}
              onChange={e => setField("mailingAddress", e.target.value)} // Update mailingAddress in form state
              required
            />
          </SectionCard>
        )}

        {/* Conditional rendering for Steps 4-7: Individual event sections */}
        {step >= 4 && step <= 7 && (
          <EventSection
            index={step - 4} // Convert step number to array index (0-3)
            data={form.events[step - 4]} // Pass the event data for this step
            setField={(name, value) => setEventField(step - 4, name, value)} // Pass update function for this event
          />
        )}

        {/* Navigation buttons section */}
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          {/* Show Back button only if not on first step */}
          {step > 1 && (
            <button type="button" onClick={handleBack}>
              Back
            </button>
          )}
          {/* Show Next button for steps 1-6, Submit button for step 7 */}
          {step < 7 ? (
            <button type="button" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button type="submit">
              Submit
            </button>
          )}
        </div>

        {/* Reminder text at bottom of form */}
        <p style={{ marginTop: 16, fontSize: 12, color: "#555" }}>
          Reminder: please submit at least 10 days before funds are needed. You may leave extra event sections blank.
        </p>
      </form>
    </div>
  );
}

// --- Presentational helper components ---

// Reusable component for creating styled section cards
// Props: title (string), children (React elements to render inside)
function SectionCard({ title, children }) {
  return (
    <section style={{
      border: "1px solid #e5e5e5",    // Light gray border
      borderRadius: 8,                // Rounded corners
      padding: 16,                    // Internal spacing
      marginBottom: 12,               // Space below each section
      background: "#fafafa"           // Light gray background
    }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {/* Grid layout for form elements with consistent spacing */}
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
    </section>
  );
}

// Component for rendering individual event information sections (steps 4-7)
// Props: index (0-3), data (event object), setField (function to update event fields)
function EventSection({ index, data, setField }) {
  const n = index + 1; // Convert 0-based index to 1-based event number
  return (
    <SectionCard title={`Section ${index + 4} — Event #${n} information`}>
      <p style={{ marginTop: 0 }}>
        Please only input information for each event that requires funds. Leave any extra event pages blank.
      </p>

      {/* Event name input - required for first event only */}
      <label htmlFor={`ev${n}-name`}>Event name {n === 1 ? <Req /> : null}</label>
      <input
        id={`ev${n}-name`}
        type="text"
        value={data.name}
        onChange={e => setField("name", e.target.value)} // Update event name
        placeholder="e.g., Halaqa kickoff"
      />

      {/* Event date input - required for first event only */}
      <label htmlFor={`ev${n}-date`}>Event date {n === 1 ? <Req /> : null}</label>
      <input
        id={`ev${n}-date`}
        type="date"
        value={data.date}
        onChange={e => setField("date", e.target.value)} // Update event date
      />

      {/* Total budget input - required for first event only */}
      <label htmlFor={`ev${n}-total`}>Total budget requested for this event (CAD) {n === 1 ? <Req /> : null}</label>
      <input
        id={`ev${n}-total`}
        type="number"
        min="0.01"
        step="0.01"
        value={data.total}
        onChange={e => setField("total", e.target.value)} // Update event total
        placeholder="e.g., 100.00"
      />

      {/* Budget breakdown textarea - optional */}
      <label htmlFor={`ev${n}-breakdown`}>Breakdown of funds for this event</label>
      <textarea
        id={`ev${n}-breakdown`}
        rows={4}
        value={data.breakdown}
        onChange={e => setField("breakdown", e.target.value)} // Update event breakdown
        placeholder={`Example\nFood (Pizza, drinks): $50\nCutlery: $20\nDecorations: $30`}
      />

      {/* Additional information textarea - optional */}
      <label htmlFor={`ev${n}-extra`}>Additional information you would like us to know?</label>
      <textarea
        id={`ev${n}-extra`}
        rows={3}
        value={data.extraInfo}
        onChange={e => setField("extraInfo", e.target.value)} // Update event extra info
        placeholder="Optional"
      />
    </SectionCard>
  );
}

// Simple component to render a red asterisk for required fields
function Req() {
  return <span style={{ color: "crimson" }}>*</span>;
}
