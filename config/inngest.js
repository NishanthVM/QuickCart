import User from "@/models/User";
import connectDB from "./db";
import { Inngest } from "inngest";
import Order from "@/models/Order";

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
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      imageUrl: image_url,
    };

    await connectDB();
    await User.create(userData);
  }
);

/**
 * 2️⃣ Handle Clerk User Update
 */
export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      imageUrl: image_url || null,
    };

    await connectDB();
    await User.findByIdAndUpdate(id, userData);
  }
);

/**
 * 3️⃣ Handle Clerk User Deletion
 */
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;

    await connectDB();
    await User.findByIdAndDelete(id);
  }
);

// Inngest function to create user's order in database

export const createUserOrder = inngest.createFunction(
  {
    id: "create-user-order",
    batchEvents: {
      maxSize: 25,
      timeout: "5s",
    },
  },
  { event: "order/created" },
  async ({ events }) => {
    const orders = events.map((event) => {
      return {
        userId: event.data.userId,
        items: event.data.itesm,
        amount: event.data.amount,
        address: event.data.address,
        date: event.data.date,
      };
    });
    await connectDB();
    await Order.insertMany(orders);

    return { success: true, processed: orders.length };
  }
);
