import { json } from '@shopify/remix-oxygen';

export async function loader({ request, context }) {
  console.log("Loader function called"); // Log to server console
  const url = new URL(request.url);
  console.log("Request URL:", request.url); // Log the request URL

  // Example of returning a response
  return json({ message: "Loader is working!" });
}