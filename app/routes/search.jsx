// app/routes/search.jsx
import { json } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';

export function loader() {
  console.log("Loader function called"); // This should log
  return json({ message: "Loader is working!" });
}

export default function SearchPage() {
  console.log("SearchPage component rendered"); // This should log
  const data = useLoaderData();
  return <div>{data.message}</div>;
}