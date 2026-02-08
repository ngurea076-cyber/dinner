import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log("📡 Generic webhook/logger called!");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers));
  console.log("Query:", JSON.stringify(req.query));
  console.log("Body:", JSON.stringify(req.body));
  console.log("Timestamp:", new Date().toISOString());
  console.log("---");

  // Return success for any request
  res.status(200).json({
    success: true,
    message: "Request logged",
    timestamp: new Date().toISOString()
  });
}