import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Product from "@/models/product.js";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller({ userId });
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "You are not a seller",
      });
    }
    await connectDB();
    const products = await Product.find({});
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
