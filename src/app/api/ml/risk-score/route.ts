import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // In a real scenario, you would receive and process borrower data from the request body
    // const body = await request.json();
    
    // Simulate ML model processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return a random risk score between 300 and 850
    const score = Math.floor(Math.random() * (850 - 300 + 1)) + 300;

    return NextResponse.json({ score });
  } catch (error) {
    console.error("ML API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
