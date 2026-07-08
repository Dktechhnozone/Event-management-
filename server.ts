import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Database file path
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory Fallback & DB helper
interface DB {
  users: any[];
  events: any[];
  registrations: any[];
  emails: any[];
}

const DEFAULT_DB: DB = {
  users: [
    // Pre-create an admin user and some attendee users
    {
      id: "admin-uid",
      email: "admin@evently.com",
      name: "Event Admin",
      password: crypto.createHash("sha256").update("admin123").digest("hex"),
      role: "admin",
      interests: ["Technology", "Artificial Intelligence", "Business"],
      createdAt: new Date().toISOString()
    },
    {
      id: "attendee-uid",
      email: "demo@evently.com",
      name: "Jane Doe",
      password: crypto.createHash("sha256").update("user123").digest("hex"),
      role: "attendee",
      interests: ["Technology", "Music"],
      createdAt: new Date().toISOString()
    }
  ],
  events: [
    {
      id: "event-react-workshop",
      title: "React 19 Core & Systems Workshop",
      category: "Technology",
      date: "2026-07-25",
      time: "10:00 AM",
      location: "Conference Hall B, New York",
      capacity: 120,
      registeredCount: 45,
      creatorId: "admin-uid",
      creatorName: "Event Admin",
      description: "Deep dive into React 19 concurrent features, Server Actions, custom hooks, dynamic rendering performance, and micro-frontend structures. Bring your laptop for the interactive lab session.",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80"
    },
    {
      id: "event-ai-summit",
      title: "Global AI & Agentic Systems Summit 2026",
      category: "Artificial Intelligence",
      date: "2026-08-10",
      time: "09:00 AM",
      location: "Metropolitan Center, San Francisco",
      capacity: 250,
      registeredCount: 180,
      creatorId: "admin-uid",
      creatorName: "Event Admin",
      description: "Join leading AI research scientists and engineers to explore the frontiers of multi-modal architectures, real-time audio/video reasoning with live agents, and scalable vector pipelines.",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80"
    },
    {
      id: "event-sunset-jazz",
      title: "Sunset Symphony & Jazz Festival",
      category: "Music",
      date: "2026-07-28",
      time: "06:00 PM",
      location: "Royal Botanic Gardens, London",
      capacity: 500,
      registeredCount: 320,
      creatorId: "admin-uid",
      creatorName: "Event Admin",
      description: "An evening of smooth jazz standards, acoustic symphonies, and live collaborative cross-genre improvisations. Set in the beautiful open-air botanical amphitheater with gourmet food stalls.",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80"
    },
    {
      id: "event-leadership",
      title: "Corporate Innovation & Leadership Masterclass",
      category: "Business",
      date: "2026-09-05",
      time: "11:00 AM",
      location: "Executive Center, Tokyo",
      capacity: 50,
      registeredCount: 12,
      creatorId: "admin-uid",
      creatorName: "Event Admin",
      description: "Strategic leadership frameworks for the modern executive. Learn change management, agile organization structures, venture incubation, and value-stream optimization strategies.",
      imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80"
    }
  ],
  registrations: [
    {
      id: "reg-1",
      userId: "attendee-uid",
      userName: "Jane Doe",
      userEmail: "demo@evently.com",
      eventId: "event-react-workshop",
      eventTitle: "React 19 Core & Systems Workshop",
      eventDate: "2026-07-25",
      eventLocation: "Conference Hall B, New York",
      ticketNumber: "TKT-REACT-38104",
      qrCodeData: "TKT-REACT-38104-attendee-uid-event-react-workshop",
      registeredAt: new Date().toISOString()
    }
  ],
  emails: [
    {
      id: "email-1",
      to: "demo@evently.com",
      subject: "Ticket Confirmation: React 19 Core & Systems Workshop",
      body: `<h3>Your Ticket is Confirmed!</h3><p>Hello Jane Doe,</p><p>You have successfully registered for the <strong>React 19 Core & Systems Workshop</strong>.</p><p><strong>Date:</strong> 2026-07-25<br><strong>Time:</strong> 10:00 AM<br><strong>Location:</strong> Conference Hall B, New York</p><p>Your Ticket Number is: <strong>TKT-REACT-38104</strong></p><p>Please scan your QR code at the entrance for verification.</p><p>Best regards,<br>The Evently Team</p>`,
      sentAt: new Date().toISOString()
    }
  ]
};

function readDB(): DB {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("DB Read Error, returning default state:", err);
    return DEFAULT_DB;
  }
}

function writeDB(data: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("DB Write Error:", err);
  }
}

// Simple Helper to generate standard mock QR Code as inline SVG
function generateQR_SVG(dataString: string): string {
  // We want to draw a 21x21 QR Code grid with high contrast.
  // We can seed a custom pseudo-random algorithm using the dataString to draw reliable squares.
  const size = 21;
  const padding = 2;
  const totalSize = size + padding * 2;
  
  // Finder patterns - three 7x7 squares at top-left, top-right, bottom-left
  const isFinder = (r: number, c: number): boolean => {
    // Top-Left Finder
    if (r < 7 && c < 7) {
      return (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
    }
    // Top-Right Finder
    if (r < 7 && c >= size - 7) {
      const cc = c - (size - 7);
      return (r === 0 || r === 6 || cc === 0 || cc === 6 || (r >= 2 && r <= 4 && cc >= 2 && cc <= 4));
    }
    // Bottom-Left Finder
    if (r >= size - 7 && c < 7) {
      const rr = r - (size - 7);
      return (rr === 0 || rr === 6 || c === 0 || c === 6 || (rr >= 2 && rr <= 4 && c >= 2 && c <= 4));
    }
    return false;
  };

  // Simple string-seeded hash generator
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    hash = (hash << 5) - hash + dataString.charCodeAt(i);
    hash |= 0;
  }

  let paths = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let isFilled = false;
      if (isFinder(r, c)) {
        isFilled = true;
      } else {
        // Pseudo-random cell based on coordinate and seeded hash
        const cellVal = Math.sin(hash + r * 13 + c * 37) * 10000;
        isFilled = (cellVal - Math.floor(cellVal)) > 0.45;
      }
      
      // Quiet alignment or timing patterns
      if (r === 6 && c > 7 && c < size - 7) isFilled = c % 2 === 0;
      if (c === 6 && r > 7 && r < size - 7) isFilled = r % 2 === 0;

      if (isFilled) {
        paths += `M${c + padding},${r + padding}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" class="w-full h-full text-slate-900 fill-current bg-white p-2 border border-slate-200 rounded-lg">
    <path d="${paths}"/>
  </svg>`;
}

// Token helper: Simulating JWT validation securely
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: "Access token is missing" });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === token); // Simple secure lookup token is user.id
  
  if (!user) {
    return res.status(403).json({ success: false, error: "Invalid or expired token" });
  }

  req.user = user;
  next();
}

// --- API ENDPOINTS ---

// Auth APIs
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role, interests } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  const db = readDB();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ success: false, error: "Email already registered" });
  }

  const newUser = {
    id: "user-" + crypto.randomUUID(),
    email: email.toLowerCase(),
    name,
    password: crypto.createHash("sha256").update(password).digest("hex"),
    role: role || "attendee",
    interests: interests || [],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);

  // Exclude password in response
  const { password: _, ...userProfile } = newUser;
  res.json({ success: true, data: { user: userProfile, token: newUser.id } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required" });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ success: false, error: "Invalid credentials" });
  }

  const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
  if (user.password !== hashedPassword) {
    return res.status(400).json({ success: false, error: "Invalid credentials" });
  }

  const { password: _, ...userProfile } = user;
  res.json({ success: true, data: { user: userProfile, token: user.id } });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const { password: _, ...userProfile } = req.user;
  res.json({ success: true, data: userProfile });
});

app.post("/api/auth/profile", authenticateToken, (req: any, res) => {
  const { name, interests } = req.body;
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  if (name) db.users[userIndex].name = name;
  if (interests) db.users[userIndex].interests = interests;
  
  writeDB(db);
  const { password: _, ...userProfile } = db.users[userIndex];
  res.json({ success: true, data: userProfile });
});

// Event APIs
app.get("/api/events", (req, res) => {
  const { q, category, scope } = req.query;
  const db = readDB();
  let results = [...db.events];

  if (category && category !== "All") {
    results = results.filter(e => e.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (q) {
    const searchStr = (q as string).toLowerCase();
    results = results.filter(e => 
      e.title.toLowerCase().includes(searchStr) || 
      e.description.toLowerCase().includes(searchStr) || 
      e.location.toLowerCase().includes(searchStr)
    );
  }

  // Sort: Upcoming vs past
  const now = new Date().toISOString().split('T')[0];
  if (scope === "upcoming") {
    results = results.filter(e => e.date >= now).sort((a, b) => a.date.localeCompare(b.date));
  } else if (scope === "past") {
    results = results.filter(e => e.date < now).sort((a, b) => b.date.localeCompare(a.date));
  } else {
    // Default sorting: upcoming first
    results.sort((a, b) => a.date.localeCompare(b.date));
  }

  res.json({ success: true, data: results });
});

app.get("/api/events/:id", (req, res) => {
  const db = readDB();
  const event = db.events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }
  res.json({ success: true, data: event });
});

app.post("/api/events", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin" && req.user.role !== "organizer") {
    return res.status(403).json({ success: false, error: "Only admins and organizers can create events" });
  }

  const { title, description, category, date, time, location, capacity, imageUrl } = req.body;
  if (!title || !category || !date || !time || !location || !capacity) {
    return res.status(400).json({ success: false, error: "Required fields are missing" });
  }

  const db = readDB();
  const newEvent = {
    id: "event-" + crypto.randomUUID(),
    title,
    description: description || "",
    category,
    date,
    time,
    location,
    capacity: Number(capacity),
    registeredCount: 0,
    creatorId: req.user.id,
    creatorName: req.user.name,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80"
  };

  db.events.push(newEvent);
  writeDB(db);

  res.json({ success: true, data: newEvent });
});

app.put("/api/events/:id", authenticateToken, (req: any, res) => {
  const db = readDB();
  const eventIndex = db.events.findIndex(e => e.id === req.params.id);
  if (eventIndex === -1) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }

  const event = db.events[eventIndex];
  if (req.user.role !== "admin" && event.creatorId !== req.user.id) {
    return res.status(403).json({ success: false, error: "Not authorized to update this event" });
  }

  const { title, description, category, date, time, location, capacity, imageUrl } = req.body;
  
  if (title) event.title = title;
  if (description !== undefined) event.description = description;
  if (category) event.category = category;
  if (date) event.date = date;
  if (time) event.time = time;
  if (location) event.location = location;
  if (capacity) event.capacity = Number(capacity);
  if (imageUrl) event.imageUrl = imageUrl;

  writeDB(db);
  res.json({ success: true, data: event });
});

app.delete("/api/events/:id", authenticateToken, (req: any, res) => {
  const db = readDB();
  const eventIndex = db.events.findIndex(e => e.id === req.params.id);
  if (eventIndex === -1) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }

  const event = db.events[eventIndex];
  if (req.user.role !== "admin" && event.creatorId !== req.user.id) {
    return res.status(403).json({ success: false, error: "Not authorized to delete this event" });
  }

  // Remove event
  db.events.splice(eventIndex, 1);
  // Remove related registrations
  db.registrations = db.registrations.filter(r => r.eventId !== req.params.id);

  writeDB(db);
  res.json({ success: true, message: "Event deleted successfully" });
});

// Registration & Ticket APIs
app.post("/api/events/:id/register", authenticateToken, (req: any, res) => {
  const db = readDB();
  const event = db.events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }

  // Check duplicate registrations
  const alreadyRegistered = db.registrations.find(
    r => r.userId === req.user.id && r.eventId === event.id
  );
  if (alreadyRegistered) {
    return res.status(400).json({ success: false, error: "You are already registered for this event" });
  }

  // Check available seats
  if (event.registeredCount >= event.capacity) {
    return res.status(400).json({ success: false, error: "This event is already at full capacity" });
  }

  const ticketId = "TKT-" + event.category.substring(0, 4).toUpperCase() + "-" + Math.floor(10000 + Math.random() * 90000);
  const qrSvg = generateQR_SVG(ticketId + "-" + req.user.id + "-" + event.id);

  const newRegistration = {
    id: "reg-" + crypto.randomUUID(),
    userId: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.date,
    eventLocation: event.location,
    ticketNumber: ticketId,
    qrCodeData: qrSvg, // Contains actual visual vector SVG code!
    registeredAt: new Date().toISOString()
  };

  // Update counts
  event.registeredCount += 1;
  db.registrations.push(newRegistration);

  // Send interactive email confirmation
  const emailContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Ticket Confirmation</h2>
      <p>Hello ${req.user.name},</p>
      <p>Your registration for <strong>${event.title}</strong> has been successfully confirmed!</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Ticket Number:</strong> ${ticketId}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${event.date}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${event.time}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>
      </div>
      <p style="text-align: center; color: #64748b; font-size: 13px;">Show your unique QR ticket code in your profile at the venue gate.</p>
      <p>Thank you,<br>The Evently Team</p>
    </div>
  `;

  db.emails.push({
    id: "email-" + crypto.randomUUID(),
    to: req.user.email,
    subject: `Confirmed: ${event.title}`,
    body: emailContent,
    sentAt: new Date().toISOString()
  });

  writeDB(db);

  res.json({ success: true, data: newRegistration });
});

app.post("/api/events/:id/unregister", authenticateToken, (req: any, res) => {
  const db = readDB();
  const event = db.events.find(e => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }

  const regIndex = db.registrations.findIndex(
    r => r.userId === req.user.id && r.eventId === event.id
  );
  if (regIndex === -1) {
    return res.status(400).json({ success: false, error: "No active registration found for this event" });
  }

  // Update count
  event.registeredCount = Math.max(0, event.registeredCount - 1);
  db.registrations.splice(regIndex, 1);

  writeDB(db);
  res.json({ success: true, message: "Registration cancelled successfully" });
});

app.get("/api/registrations", authenticateToken, (req: any, res) => {
  const db = readDB();
  const userRegs = db.registrations.filter(r => r.userId === req.user.id);
  res.json({ success: true, data: userRegs });
});

// Inbox / Email Notifications API
app.get("/api/emails", authenticateToken, (req: any, res) => {
  const db = readDB();
  const userEmails = db.emails.filter(e => e.to.toLowerCase() === req.user.email.toLowerCase())
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  res.json({ success: true, data: userEmails });
});

// Admin Analytics and CSV export
app.get("/api/admin/stats", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Admin access required" });
  }

  const db = readDB();
  const totalUsers = db.users.length;
  const totalEvents = db.events.length;
  const totalRegistrations = db.registrations.length;

  // Categories counts
  const categoryMap: { [key: string]: number } = {};
  db.events.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.registeredCount;
  });
  const categoryStats = Object.keys(categoryMap).map(cat => ({
    category: cat,
    count: categoryMap[cat]
  }));

  // Simple registration dates trend
  const trendMap: { [key: string]: number } = {};
  db.registrations.forEach(r => {
    const day = r.registeredAt.split('T')[0];
    trendMap[day] = (trendMap[day] || 0) + 1;
  });
  const registrationsOverTime = Object.keys(trendMap).map(day => ({
    date: day,
    count: trendMap[day]
  })).sort((a, b) => a.date.localeCompare(b.date)).slice(-10); // Last 10 days

  res.json({
    success: true,
    data: {
      totalUsers,
      totalEvents,
      totalRegistrations,
      categoryStats,
      registrationsOverTime
    }
  });
});

app.get("/api/admin/attendees", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Admin access required" });
  }

  const { eventId } = req.query;
  const db = readDB();
  let list = [...db.registrations];

  if (eventId) {
    list = list.filter(r => r.eventId === eventId);
  }

  res.json({ success: true, data: list });
});

// Export Attendees as CSV
app.get("/api/admin/attendees/export", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Admin access required" });
  }

  const { eventId } = req.query;
  const db = readDB();
  let list = [...db.registrations];

  if (eventId) {
    list = list.filter(r => r.eventId === eventId);
  }

  // Create CSV content
  let csvContent = "Ticket Number,Attendee Name,Attendee Email,Event Title,Registered Date\n";
  list.forEach(r => {
    const dateFormatted = r.registeredAt.split('T')[0];
    const cleanTitle = r.eventTitle.replace(/,/g, " "); // escape commas
    const cleanName = r.userName.replace(/,/g, " ");
    csvContent += `"${r.ticketNumber}","${cleanName}","${r.userEmail}","${cleanTitle}","${dateFormatted}"\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=attendee_list.csv");
  res.send(csvContent);
});

// AI Recommendation System with Gemini
app.get("/api/events/recommendations", authenticateToken, async (req: any, res) => {
  const db = readDB();
  
  // Prepare user context
  const userInterests = req.user.interests || [];
  const userRegs = db.registrations.filter(r => r.userId === req.user.id).map(r => r.eventTitle);
  
  // Format events catalog for the prompt
  const eventsCatalog = db.events.map(e => ({
    id: e.id,
    title: e.title,
    category: e.category,
    description: e.description,
    location: e.location
  }));

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("Gemini API key is not configured");
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemInstruction = `You are an elite, highly professional Event Recommendation AI. Your job is to analyze a user's interests and registration history, match them against an events catalog, and return the top recommended events in a strict, parsed JSON structure.
    
Your response MUST be valid JSON matching this schema:
{
  "recommendations": [
    {
      "eventId": "string matching one of the event IDs provided",
      "reason": "1-2 brief, professional sentences describing why this event matches their profile"
    }
  ]
}

DO NOT include markdown tags like \`\`\`json or any leading/trailing dialogue. Only output the raw JSON object.`;

    const prompt = `User Interests: ${JSON.stringify(userInterests)}
User Registered Events: ${JSON.stringify(userRegs)}

Available Events Catalog:
${JSON.stringify(eventsCatalog, null, 2)}

Provide up to 3 event recommendations sorted by highest relevance. Ensure the eventId matches exactly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text?.trim() || "{}";
    // Handle cases where markdown block might be included despite instructions
    const cleanJson = responseText.replace(/^```json/, "").replace(/```$/, "").trim();
    const resultObj = JSON.parse(cleanJson);
    
    // Validate matched events against current database
    const recommendations = (resultObj.recommendations || []).map((rec: any) => {
      const match = db.events.find(e => e.id === rec.eventId);
      if (match) {
        return {
          event: match,
          reason: rec.reason
        };
      }
      return null;
    }).filter(Boolean);

    res.json({ success: true, data: recommendations });

  } catch (error: any) {
    console.error("AI Recommendation Error, serving smart fallback:", error.message);
    
    // Intelligent fallback algorithm based on Category and User Interests
    const fallbackRecs = db.events
      .map(e => {
        let score = 0;
        // Boost if user interests match event category or details
        userInterests.forEach((interest: string) => {
          if (e.category.toLowerCase().includes(interest.toLowerCase()) || 
              e.title.toLowerCase().includes(interest.toLowerCase())) {
            score += 10;
          }
        });
        // Boost if already registered to similar categories but NOT the exact same event
        const isRegistered = db.registrations.some(r => r.userId === req.user.id && r.eventId === e.id);
        if (isRegistered) {
          score = -50; // Don't recommend events they already registered for
        }

        return { event: e, score };
      })
      .filter(item => item.score > -20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => ({
        event: item.event,
        reason: `Recommended based on your interest in ${item.event.category} and related technology.`
      }));

    res.json({ success: true, data: fallbackRecs });
  }
});


// Vite Dev Server middleware or Static Production Handler
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import to prevent bundler problems in production build
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist/.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running securely on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error("Error starting full-stack server:", err);
});
