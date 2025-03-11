export const config = { runtime: 'edge' };

export default function handler() {
  console.log('Vercel function API endpoint (edge)!');
  return Response.json({message: "Hello World From Vercel Public Function (edge)"});
}
