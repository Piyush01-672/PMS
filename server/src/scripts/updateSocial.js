import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { SiteSettings } from '../models/index.js';

async function run() {
  await connectDB(env.MONGODB_URI);
  const social = [
    { platform: 'whatsapp', url: 'https://whatsapp.com/channel/0029Vb8ePtV6xCSKZnaBfu0N' },
    { platform: 'youtube', url: 'https://youtube.com/@passionmathsstudy?si=tc1BLKqOF3RTZnnc' },
    { platform: 'instagram', url: 'https://www.instagram.com/nitishkumar65462?stkn=dXJ5N3M0c2U1NDhl' },
    { platform: 'facebook', url: 'https://www.facebook.com/share/19ZEaJ72X5/' },
  ];

  await SiteSettings.findOneAndUpdate(
    { key: 'site' },
    {
      $set: {
        social,
        'contact.whatsapp': 'https://whatsapp.com/channel/0029Vb8ePtV6xCSKZnaBfu0N',
      },
    },
    { upsert: true },
  );

  console.log('[social] SiteSettings updated successfully with 4 social links.');
  await disconnectDB();
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
