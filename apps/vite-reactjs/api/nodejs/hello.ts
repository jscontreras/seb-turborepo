import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LoremIpsum } from "lorem-ipsum";

export default function (request: VercelRequest, response: VercelResponse) {
  const lorem = new LoremIpsum({
    sentencesPerParagraph: {
      max: 8,
      min: 4
    },
    wordsPerSentence: {
      max: 16,
      min: 4
    }
  });

  const text = lorem.generateParagraphs(2);
  console.log('Vercel function API endpoint (nodejs)!')
  return response.json({ message: "Hello World From Vercel Public Function (nodejs)", text });
}
