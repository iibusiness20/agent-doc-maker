// Demo agent data for testing the documentation generator
// This represents a typical Retell AI agent structure

export const demoAgentJson = {
  id: "agent_demo_123",
  name: "Customer Support Agent",
  description: "An AI voice agent that handles customer inquiries, appointment booking, and general support questions for a healthcare clinic.",
  settings: {
    model: "gpt-4-turbo",
    temperature: 0.7,
    language: "en-US",
    voice: "alloy",
    maxDuration: 300
  },
  nodes: [
    {
      id: "node_start",
      type: "start",
      name: "Welcome",
      prompt: "Hello! Thank you for calling HealthFirst Clinic. My name is Sarah, and I'm here to help you today. How may I assist you?",
      conditions: [],
      next: [
        { condition: "appointment", targetNodeId: "node_booking" },
        { condition: "general_inquiry", targetNodeId: "node_general" },
        { condition: "emergency", targetNodeId: "node_emergency" }
      ]
    },
    {
      id: "node_booking",
      type: "prompt",
      name: "Appointment Booking",
      prompt: `I'd be happy to help you schedule an appointment. Let me gather some information.

First, could you please tell me:
1. Your full name
2. Your date of birth
3. The reason for your visit
4. Your preferred date and time

I'll check our availability and find the best slot for you.`,
      conditions: ["user mentions appointment", "user wants to book", "schedule visit"],
      next: [
        { condition: "confirmed", targetNodeId: "node_confirm" },
        { condition: "reschedule", targetNodeId: "node_reschedule" },
        { condition: "cancel", targetNodeId: "node_cancel" }
      ]
    },
    {
      id: "node_general",
      type: "prompt",
      name: "General Inquiry",
      prompt: `I'm here to answer any questions you might have about our clinic.

We offer the following services:
- Primary care consultations
- Specialist referrals
- Lab work and diagnostics
- Prescription refills
- Telehealth appointments

What would you like to know more about?`,
      conditions: ["user has question", "general information"],
      next: [
        { condition: "services", targetNodeId: "node_services" },
        { condition: "insurance", targetNodeId: "node_insurance" },
        { condition: "hours", targetNodeId: "node_hours" }
      ]
    },
    {
      id: "node_emergency",
      type: "prompt",
      name: "Emergency Handler",
      prompt: `I understand this may be urgent. If you're experiencing a medical emergency, please hang up and dial 911 immediately.

For urgent but non-emergency situations, I can help you:
- Connect with our on-call nurse
- Find the nearest urgent care facility
- Schedule a same-day appointment if available

How would you like to proceed?`,
      conditions: ["emergency", "urgent", "immediate help"],
      next: [
        { condition: "transfer_nurse", targetNodeId: "node_transfer" },
        { condition: "urgent_care", targetNodeId: "node_urgent_care" }
      ]
    },
    {
      id: "node_confirm",
      type: "prompt",
      name: "Confirmation",
      prompt: `Great! I've booked your appointment. Here are the details:

[Appointment Summary]

You'll receive a confirmation text and email shortly. Is there anything else I can help you with today?`,
      conditions: ["booking confirmed"],
      next: [
        { condition: "more_help", targetNodeId: "node_general" },
        { condition: "done", targetNodeId: "node_end" }
      ]
    },
    {
      id: "node_services",
      type: "prompt",
      name: "Services Info",
      prompt: `Our clinic offers comprehensive healthcare services including:

**Primary Care:**
- Annual physicals
- Preventive screenings
- Chronic disease management

**Specialty Care:**
- Cardiology consultations
- Dermatology
- Women's health

**Diagnostics:**
- On-site lab work
- X-ray and imaging
- Same-day results for most tests

Would you like me to help you schedule an appointment for any of these services?`,
      conditions: ["services", "what do you offer"],
      next: [
        { condition: "book", targetNodeId: "node_booking" },
        { condition: "more_info", targetNodeId: "node_general" }
      ]
    },
    {
      id: "node_insurance",
      type: "prompt",
      name: "Insurance Information",
      prompt: `We accept most major insurance plans including:

- Blue Cross Blue Shield
- Aetna
- Cigna
- UnitedHealthcare
- Medicare and Medicaid

If you're unsure about your coverage, I can transfer you to our billing department who can verify your benefits. Would you like me to do that?`,
      conditions: ["insurance", "coverage", "payment"],
      next: [
        { condition: "transfer_billing", targetNodeId: "node_transfer" },
        { condition: "continue", targetNodeId: "node_general" }
      ]
    },
    {
      id: "node_hours",
      type: "prompt",
      name: "Operating Hours",
      prompt: `Our clinic hours are:

**Monday - Friday:** 8:00 AM - 6:00 PM
**Saturday:** 9:00 AM - 2:00 PM
**Sunday:** Closed

We also offer 24/7 telehealth appointments for established patients. Would you like to schedule a visit?`,
      conditions: ["hours", "when open", "schedule"],
      next: [
        { condition: "book", targetNodeId: "node_booking" },
        { condition: "other", targetNodeId: "node_general" }
      ]
    },
    {
      id: "node_transfer",
      type: "prompt",
      name: "Transfer Call",
      prompt: "I'll transfer you now. Please hold for a moment while I connect you. Thank you for your patience.",
      conditions: ["transfer requested"],
      next: [
        { condition: "complete", targetNodeId: "node_end" }
      ]
    },
    {
      id: "node_end",
      type: "end",
      name: "Goodbye",
      prompt: "Thank you for calling HealthFirst Clinic! Have a wonderful day, and we look forward to seeing you soon. Goodbye!",
      conditions: [],
      next: []
    }
  ]
};

export const getDemoJsonString = (): string => {
  return JSON.stringify(demoAgentJson, null, 2);
};
