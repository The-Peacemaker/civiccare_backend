import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import Comment from "../models/Comment.js";
import Upvote from "../models/Upvote.js";
import StatusHistory from "../models/StatusHistory.js";
import Notification from "../models/Notification.js";

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

const makeUser = (data) => User.create(data);

const run = async () => {
  await connectDB();

  if (!process.argv.includes("--keep")) {
    await Promise.all([
      Complaint.deleteMany({}),
      Comment.deleteMany({}),
      Upvote.deleteMany({}),
      StatusHistory.deleteMany({}),
      Notification.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log("Cleared existing data");
  }

  // --- Users -------------------------------------------------------------
  const admin = await makeUser({
    name: "Municipal Admin",
    email: "admin@civiccare.local",
    authProvider: "password",
    role: "admin",
  });

  const authority = await makeUser({
    name: "Corporation Officer",
    email: "authority@civiccare.local",
    authProvider: "password",
    role: "authority",
  });

  const john = await makeUser({
    name: "John Citizen",
    email: "john@example.com",
    authProvider: "google",
    role: "citizen",
    anonymousHandle: "Anonymous User 101",
  });

  const sarah = await makeUser({
    name: "Sarah Johnson",
    email: "sarah@example.com",
    authProvider: "google",
    role: "citizen",
    anonymousHandle: "Anonymous User 202",
  });

  const mike = await makeUser({
    name: "Mike Wilson",
    email: "mike@example.com",
    authProvider: "google",
    role: "citizen",
    anonymousHandle: "Anonymous User 303",
  });

  const david = await makeUser({
    name: "David Chen",
    email: "david@example.com",
    authProvider: "google",
    role: "citizen",
    anonymousHandle: "Anonymous User 404",
  });

  const anon = await makeUser({
    name: "Anonymous User",
    authProvider: "guest",
    isGuest: true,
    role: "citizen",
    anonymousHandle: "Anonymous User 525",
  });

  console.log("Seeded users");

  // --- Complaints (mirrors the Figma feed) -------------------------------
  const complaintSeeds = [
    {
      title: "Large pothole on Main Street causing accidents",
      description:
        "There is a dangerous pothole near the intersection that has caused multiple vehicle damages. Immediate attention needed.",
      category: "infrastructure",
      location: { text: "Main Street & 5th Avenue", district: "Ernakulam", latitude: 9.9312, longitude: 76.2673 },
      status: "pending",
      priority: "high",
      author: john._id,
      isAnonymous: false,
      upvoteCount: 45,
      commentCount: 2,
      ageHours: 26,
    },
    {
      title: "Water supply irregular in residential area",
      description:
        "Water supply has been irregular for the past week. Residents are facing difficulties.",
      category: "water",
      location: { text: "Green Valley Apartments", district: "Ernakulam", latitude: 9.97, longitude: 76.28 },
      status: "in-progress",
      priority: "medium",
      author: sarah._id,
      isAnonymous: false,
      upvoteCount: 32,
      commentCount: 0,
      ageHours: 25,
    },
    {
      title: "Garbage not collected for 2 weeks",
      description:
        "Municipal workers have not collected garbage from our street for over two weeks. Health hazard.",
      category: "sanitation",
      location: { text: "Oak Street", district: "Thrissur", latitude: 10.5276, longitude: 76.2144 },
      status: "pending",
      priority: "low",
      author: mike._id,
      isAnonymous: false,
      upvoteCount: 67,
      commentCount: 1,
      ageHours: 24,
    },
    {
      title: "Bribery demand at Municipal Office",
      description:
        "Official demanded bribe for issuing building permit. This corruption needs to stop immediately.",
      category: "corruption",
      location: { text: "City Municipal Office", district: "Kannur", latitude: 11.8745, longitude: 75.3704 },
      status: "pending",
      priority: "high",
      author: anon._id,
      isAnonymous: true,
      upvoteCount: 89,
      commentCount: 0,
      ageHours: 23,
    },
    {
      title: "Streetlights not working for months",
      description:
        "Multiple streetlights on our road have been non-functional for over 3 months, creating safety issues.",
      category: "electricity",
      location: { text: "Park Avenue", district: "Kollam", latitude: 8.8932, longitude: 76.6141 },
      status: "in-progress",
      priority: "medium",
      author: david._id,
      isAnonymous: false,
      upvoteCount: 54,
      commentCount: 0,
      ageHours: 22,
    },
  ];

  const created = [];
  for (const seed of complaintSeeds) {
    const { ageHours, ...data } = seed;
    const complaint = await Complaint.create({ ...data, assignedTo: null });
    const when = hoursAgo(ageHours);
    // Bypass timestamps so the feed ordering matches the demo dates.
    await Complaint.collection.updateOne(
      { _id: complaint._id },
      { $set: { createdAt: when, updatedAt: when } }
    );

    await StatusHistory.create({
      complaint: complaint._id,
      oldStatus: null,
      newStatus: complaint.status,
      changedBy: complaint.author,
      note: "Report created",
      createdAt: when,
      updatedAt: when,
    });

    if (complaint.status === "in-progress") {
      await StatusHistory.create({
        complaint: complaint._id,
        oldStatus: "pending",
        newStatus: "in-progress",
        changedBy: authority._id,
        note: "Assigned to field team",
        createdAt: hoursAgo(ageHours - 4),
        updatedAt: hoursAgo(ageHours - 4),
      });
    }

    created.push(complaint);
  }
  console.log(`Seeded ${created.length} complaints`);

  // --- Comments ----------------------------------------------------------
  const pothole = created[0];
  const garbage = created[2];

  await Comment.create([
    {
      complaint: pothole._id,
      author: sarah._id,
      isAnonymous: false,
      body: "Same issue near the signal, almost damaged my tyre last night.",
      createdAt: hoursAgo(20),
    },
    {
      complaint: pothole._id,
      author: anon._id,
      isAnonymous: true,
      body: "Reported this twice already. Please fix it before someone gets hurt.",
      createdAt: hoursAgo(18),
    },
    {
      complaint: garbage._id,
      author: david._id,
      isAnonymous: false,
      body: "The dump near the corner is attracting stray dogs. Needs urgent pickup.",
      createdAt: hoursAgo(16),
    },
  ]);

  // --- A few real upvotes so toggle works --------------------------------
  await Upvote.create([
    { complaint: created[0]._id, user: admin._id },
    { complaint: created[0]._id, user: authority._id },
    { complaint: created[3]._id, user: john._id },
  ]);

  console.log("Seeded comments + upvotes");
  console.log("\nDemo users:");
  console.log(`  admin     ${admin._id}`);
  console.log(`  authority ${authority._id}`);
  console.log(`  citizen   ${john._id}  (John Citizen)`);
  console.log(`  guest     ${anon._id}  (Anonymous User 525)`);
  console.log("\nSeed complete.");

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
