const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();
if (!process.env.MONGO_URI) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}
if (!process.env.MONGO_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
}

// Import models
const Note = require('../src/models/Note');
const User = require('../src/models/User');
const Roadmap = require('../src/models/Roadmap');
const Progress = require('../src/models/Progress');
const Schedule = require('../src/models/Schedule');
const AgentMemory = require('../src/models/AgentMemory');

const MEMORY_DIR = path.join(__dirname, 'memory');

async function seed() {
  if (!process.env.MONGO_URI) {
    console.warn('\n⚠️  WARNING: MONGO_URI is not defined in backend/.env!');
    console.warn('Please add MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/database to backend/.env to seed to MongoDB Atlas.\n');
    process.exit(0); // exit gracefully so scripts don't crash the pipeline
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'agentix' });
  console.log('Connected to MongoDB.');

  // 1. Seed Notes
  const notesPath = path.join(MEMORY_DIR, 'notes.json');
  if (fs.existsSync(notesPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(notesPath, 'utf8') || '[]');
      const notesArray = Array.isArray(data) ? data : [data];
      if (notesArray.length > 0) {
        await Note.deleteMany({});
        // Map fields like 'text' or 'content' to title if title is missing
        const mappedNotes = notesArray.map(n => ({
          ...n,
          title: n.title || n.text || n.content || 'Untitled Note',
          content: n.content || n.text || ''
        }));
        await Note.insertMany(mappedNotes);
        console.log(`Seeded ${mappedNotes.length} Notes.`);
      }
    } catch (e) {
      console.error('Error seeding Notes:', e.message);
    }
  }

  // 2. Seed Users
  const usersPath = path.join(MEMORY_DIR, 'users.json');
  if (fs.existsSync(usersPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(usersPath, 'utf8') || '{}');
      const usersList = Object.values(data);
      if (usersList.length > 0) {
        await User.deleteMany({});
        const seededUsers = usersList.map(u => ({
          displayName: u.displayName || u.email,
          email: u.email,
          googleId: u.googleId,
          picture: u.picture,
          github: u.github,
          leetcode: u.leetcode,
          leetcode_topics: u.leetcode_topics,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
        }));
        await User.insertMany(seededUsers);
        console.log(`Seeded ${seededUsers.length} Users.`);
      }
    } catch (e) {
      console.error('Error seeding Users:', e.message);
    }
  }

  // 3. Seed Roadmaps
  const roadmapPath = path.join(MEMORY_DIR, 'roadmap.json');
  if (fs.existsSync(roadmapPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(roadmapPath, 'utf8') || '{"roadmaps":[]}');
      const roadmaps = data.roadmaps || [];
      if (roadmaps.length > 0) {
        await Roadmap.deleteMany({});
        const seededRoadmaps = roadmaps.map(r => ({
          targetGoal: r.title || 'Personal Study Plan',
          title: r.title,
          roadmapText: r.roadmap,
          completedDays: r.completed_days || [],
          completedTopics: r.completed_topics || [],
          active: true,
          createdAt: new Date()
        }));
        await Roadmap.insertMany(seededRoadmaps);
        console.log(`Seeded ${seededRoadmaps.length} Roadmaps.`);
      }
    } catch (e) {
      console.error('Error seeding Roadmaps:', e.message);
    }
  }

  // 4. Seed Progress
  const progressPath = path.join(MEMORY_DIR, 'progress.json');
  if (fs.existsSync(progressPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(progressPath, 'utf8') || '{}');
      if (data.total_tasks !== undefined) {
        await Progress.deleteMany({});
        await Progress.create({
          studyStreak: data.studyStreak || 0,
          progressPercentage: data.overall_progress || 0,
          completedTasks: data.completed_task_names || [],
          completedTaskNames: data.completed_task_names || [],
          totalTasks: data.total_tasks || 0,
          topics: data.topics || [],
          overallProgress: data.overall_progress || 0
        });
        console.log('Seeded Progress.');
      }
    } catch (e) {
      console.error('Error seeding Progress:', e.message);
    }
  }

  // 5. Seed Schedule
  const schedulePath = path.join(MEMORY_DIR, 'schedule.json');
  if (fs.existsSync(schedulePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(schedulePath, 'utf8') || '{"today":[],"tomorrow":[]}');
      await Schedule.deleteMany({});
      await Schedule.create({
        taskQueue: data.today || [],
        today: data.today || [],
        tomorrow: data.tomorrow || [],
        reminders: []
      });
      console.log('Seeded Schedule.');
    } catch (e) {
      console.error('Error seeding Schedule:', e.message);
    }
  }

  // 6. Seed AgentMemory
  const agentMemoryPath = path.join(MEMORY_DIR, 'agent_memory.json');
  if (fs.existsSync(agentMemoryPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(agentMemoryPath, 'utf8') || '{"sessions":[]}');
      const sessions = data.sessions || [];
      if (sessions.length > 0) {
        await AgentMemory.deleteMany({});
        const seededSessions = sessions.map(s => ({
          sessionId: s.id,
          chatContext: (s.messages || []).map(m => ({
            ...m,
            content: Array.isArray(m.content) ? m.content.join('\n') : (typeof m.content === 'object' ? JSON.stringify(m.content) : String(m.content || ''))
          })),
          title: s.title,
          lastUpdated: new Date()
        }));
        await AgentMemory.insertMany(seededSessions);
        console.log(`Seeded ${seededSessions.length} AgentMemory sessions.`);
      }
    } catch (e) {
      console.error('Error seeding AgentMemory:', e.message);
    }
  }

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
