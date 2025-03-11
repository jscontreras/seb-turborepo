import { NextResponse } from "next/server";

export async function GET() {

  const env_vars: { [key: string]: string } = {};
  const var_names = [
    'NEW_RELIC_APP_NAME',
    'NEW_RELIC_LICENSE_KEY',
    'WEBHOOK_SECRET',
    'NEW_RELIC_USER_KEY',
    'SALUTE'
  ];
  var_names.forEach(key => {
    const value = process.env[key];
    if (value) {
      env_vars[key] = 'x'.repeat(value.length);
    }
  });
  return NextResponse.json(
    { env_vars },
    { status: 200 },
  );

}