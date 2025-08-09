import User from "@/models/user";
import connectDB from "./db";
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "quickcart-next" });

/**
 * Utility: Validate and log events
 */
function validateEventData(event, functionName) {
  if (!event || !event.data) {
    console.error(`[${functionName}] Missing event.data:`, event);
    return null;
  }
  return event.data;
}

/**
 * 1️⃣ Handle Clerk User Creation
 */
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    console.log(
      "[syncUserCreation] Incoming event:",
      JSON.stringify(event, null, 2)
    );

    const data = validateEventData(event, "syncUserCreation");
    if (!data) return; // stop if no data

    const { id, first_name, last_name, email_addresses, image_url } = data;

    const userData = {
      _id: id,
      email: email_addresses?.[0]?.email_address || null,
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      imageUrl: image_url || null,
      cartItems: {}, // initialize to prevent null issues later
    };

    await connectDB();
    await User.create(userData);
    console.log(`[syncUserCreation] User created: ${id}`);
  }
);

/**
 * 2️⃣ Handle Clerk User Update
 */
export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    console.log(
      "[syncUserUpdation] Incoming event:",
      JSON.stringify(event, null, 2)
    );

    const data = validateEventData(event, "syncUserUpdation");
    if (!data) return;

    const { id, first_name, last_name, email_addresses, image_url } = data;

    const userData = {
      _id: id,
      email: email_addresses?.[0]?.email_address || null,
      name: `${first_name || ""} ${last_name || ""}`.trim(),
      imageUrl: image_url || null,
    };

    await connectDB();
    const updated = await User.findByIdAndUpdate(id, userData, { new: true });
    if (updated) {
      console.log(`[syncUserUpdation] User updated: ${id}`);
    } else {
      console.warn(
        `[syncUserUpdation] No user found for ID: ${id}. Possibly needs creation first.`
      );
    }
  }
);

/**
 * 3️⃣ Handle Clerk User Deletion
 */
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    console.log(
      "[syncUserDeletion] Incoming event:",
      JSON.stringify(event, null, 2)
    );

    const data = validateEventData(event, "syncUserDeletion");
    if (!data) return;

    const { id } = data;

    await connectDB();
    const deleted = await User.findByIdAndDelete(id);
    if (deleted) {
      console.log(`[syncUserDeletion] User deleted: ${id}`);
    } else {
      console.warn(`[syncUserDeletion] No user found to delete for ID: ${id}`);
    }
  }
);
