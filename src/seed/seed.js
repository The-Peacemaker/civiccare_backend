import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import Comment from "../models/Comment.js";
import Upvote from "../models/Upvote.js";
import StatusHistory from "../models/StatusHistory.js";
import Notification from "../models/Notification.js";
import Community from "../models/Community.js";
import CommunityMember from "../models/CommunityMember.js";
import Resource from "../models/Resource.js";

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
      CommunityMember.deleteMany({}),
      Community.deleteMany({}),
      Resource.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log("Cleared existing data");
  }

  const demoHash = await bcrypt.hash("password123", 10);

  // --- Users -------------------------------------------------------------
  const admin = await makeUser({
    name: "Municipal Admin",
    email: "admin@civiccare.local",
    passwordHash: demoHash,
    authProvider: "password",
    role: "admin",
  });

  const authority = await makeUser({
    name: "Corporation Officer",
    email: "authority@civiccare.local",
    passwordHash: demoHash,
    authProvider: "password",
    role: "authority",
  });

  const john = await makeUser({
    name: "John Citizen",
    email: "john@example.com",
    passwordHash: demoHash,
    authProvider: "google",
    role: "citizen",
    anonymousHandle: "Anonymous User 101",
  });

  const sarah = await makeUser({
    name: "Sarah Johnson",
    email: "sarah@example.com",
    passwordHash: demoHash,
    authProvider: "google",
    role: "citizen",
    anonymousHandle: "Anonymous User 202",
  });

  const mike = await makeUser({
    name: "Mike Wilson",
    email: "mike@example.com",
    passwordHash: demoHash,
    authProvider: "google",
    role: "citizen",
    anonymousHandle: "Anonymous User 303",
  });

  const david = await makeUser({
    name: "David Chen",
    email: "david@example.com",
    passwordHash: demoHash,
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
      shareCount: 45,
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
      shareCount: 29,
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
      shareCount: 57,
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
      shareCount: 30,
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
      shareCount: 18,
      ageHours: 22,
    },
    {
      title: "Broken footpath near Government School",
      description:
        "The footpath outside the school is broken and flooded, forcing children to walk on the road.",
      category: "infrastructure",
      location: { text: "Government School Road", district: "Thrissur", latitude: 10.52, longitude: 76.22 },
      status: "resolved",
      priority: "medium",
      author: sarah._id,
      isAnonymous: false,
      upvoteCount: 41,
      commentCount: 0,
      shareCount: 12,
      ageHours: 20,
    },
    {
      title: "Illegal dumping near canal",
      description:
        "Household waste is being dumped along the canal bank, blocking the flow and causing a foul smell.",
      category: "sanitation",
      location: { text: "Canal Bund Road", district: "Alappuzha", latitude: 9.4981, longitude: 76.3388 },
      status: "pending",
      priority: "high",
      author: anon._id,
      isAnonymous: true,
      upvoteCount: 38,
      commentCount: 0,
      shareCount: 21,
      ageHours: 18,
    },
    {
      title: "Transformer sparking during rain",
      description:
        "A transformer near the market is sparking whenever it rains. Residents fear an electrical fire.",
      category: "electricity",
      location: { text: "Market Junction", district: "Kozhikode", latitude: 11.2588, longitude: 75.7804 },
      status: "in-progress",
      priority: "high",
      author: david._id,
      isAnonymous: false,
      upvoteCount: 47,
      commentCount: 0,
      shareCount: 9,
      ageHours: 14,
    },
    {
      title: "Bus stand toilets unusable",
      description:
        "The public toilets at the bus stand have had no water for over a week and are unusable.",
      category: "sanitation",
      location: { text: "Kollam Bus Stand", district: "Kollam", latitude: 8.8833, longitude: 76.6 },
      status: "resolved",
      priority: "low",
      author: mike._id,
      isAnonymous: false,
      upvoteCount: 26,
      commentCount: 0,
      shareCount: 6,
      ageHours: 10,
    },
    {
      title: "Stray dog menace near children's park",
      description:
        "A pack of stray dogs has been roaming the park in the evenings, frightening children and walkers.",
      category: "safety",
      location: { text: "Children's Park", district: "Ernakulam", latitude: 9.9816, longitude: 76.2999 },
      status: "pending",
      priority: "medium",
      author: john._id,
      isAnonymous: true,
      upvoteCount: 19,
      commentCount: 0,
      shareCount: 11,
      ageHours: 6,
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

  // --- Communities -------------------------------------------------------
  const communitySeeds = [
    {
      name: "Green Ernakulam",
      description:
        "Neighbours working together on waste segregation, tree planting and cleaner public spaces.",
      category: "environment",
      visibility: "public",
      location: "Ernakulam, Kerala",
      district: "Ernakulam",
      icon: "🌿",
      cover: "from-emerald-500 to-teal-600",
      createdBy: admin._id,
      memberIds: [admin._id, john._id, sarah._id, david._id],
    },
    {
      name: "Coastal Cleanup Crew",
      description: "Weekend beach and canal cleanups across Alappuzha.",
      category: "environment",
      visibility: "public",
      location: "Alappuzha, Kerala",
      district: "Alappuzha",
      icon: "🌊",
      cover: "from-cyan-500 to-blue-600",
      createdBy: sarah._id,
      memberIds: [sarah._id, mike._id, anon._id],
    },
    {
      name: "Road Safety Watch",
      description: "Private group tracking dangerous junctions and pothole repairs.",
      category: "safety",
      visibility: "private",
      location: "Ernakulam, Kerala",
      district: "Ernakulam",
      icon: "🛡️",
      cover: "from-orange-500 to-red-600",
      createdBy: john._id,
      memberIds: [john._id, authority._id, david._id],
    },
    {
      name: "Ward 12 Residents",
      description: "Local updates on water supply, streetlights and garbage collection.",
      category: "general",
      visibility: "public",
      location: "Thrissur, Kerala",
      district: "Thrissur",
      icon: "🏘️",
      cover: "from-indigo-500 to-purple-600",
      createdBy: mike._id,
      memberIds: [mike._id, sarah._id, john._id, admin._id, authority._id],
    },
  ];

  const communities = [];
  for (const seed of communitySeeds) {
    const community = await Community.create({
      name: seed.name,
      description: seed.description,
      category: seed.category,
      visibility: seed.visibility,
      location: seed.location,
      district: seed.district,
      icon: seed.icon,
      cover: seed.cover,
      createdBy: seed.createdBy,
      members: seed.memberIds,
      memberCount: seed.memberIds.length,
    });
    await CommunityMember.create(
      seed.memberIds.map((userId) => ({
        community: community._id,
        user: userId,
        role: String(userId) === String(seed.createdBy) ? "admin" : "member",
      }))
    );
    communities.push(community);
  }
  console.log(`Seeded ${communities.length} communities`);

  // --- Resources ---------------------------------------------------------
  await Resource.create([
    {
      title: "Kerala Disaster Helpline",
      description: "24x7 state emergency control room for floods and disasters.",
      category: "safety",
      type: "contact",
      phone: "1077",
      district: "",
      createdBy: admin._id,
    },
    {
      title: "Municipal Grievance Portal",
      description: "Official portal to file and track civic complaints online.",
      category: "corruption",
      type: "link",
      url: "https://lsgkerala.gov.in",
      district: "",
      createdBy: admin._id,
    },
    {
      title: "Waste Collection Schedule",
      description: "Ward-wise schedule for household waste collection.",
      category: "sanitation",
      type: "guide",
      district: "Ernakulam",
      createdBy: authority._id,
    },
    {
      title: "Kerala Water Authority Contact",
      description: "Report pipe leaks and supply interruptions.",
      category: "water",
      type: "contact",
      phone: "0471-2331111",
      district: "Ernakulam",
      createdBy: authority._id,
    },
    {
      title: "Road Repair Request",
      description: "Submit pothole and footpath repair requests to the PWD.",
      category: "infrastructure",
      type: "service",
      url: "https://keralapwd.gov.in",
      district: "",
      createdBy: authority._id,
    },
  ]);
  console.log("Seeded resources");

  // --- Notifications -----------------------------------------------------
  await Notification.create([
    {
      recipient: john._id,
      type: "status-change",
      title: "Your report status was updated",
      message: `"${created[1].title}" moved from pending to in-progress.`,
      complaint: created[1]._id,
      createdAt: hoursAgo(4),
    },
    {
      recipient: john._id,
      type: "comment",
      title: "New comment on your report",
      message: `Sarah Johnson commented on "${pothole.title}".`,
      complaint: pothole._id,
      createdAt: hoursAgo(3),
    },
    {
      recipient: john._id,
      type: "upvote",
      title: "Someone upvoted your report",
      message: `"${pothole.title}" just got another upvote.`,
      complaint: pothole._id,
      isRead: true,
      createdAt: hoursAgo(2),
    },
    {
      recipient: john._id,
      type: "community",
      title: "Community activity",
      message: `Green Ernakulam welcomed you as a member.`,
      community: communities[0]._id,
      createdAt: hoursAgo(1),
    },
  ]);
  console.log("Seeded notifications");
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
