import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

export async function POST(request) {
  try {
    const { DATABASE_URL, ADMIN_USERNAME = 'admin' } = process.env;

    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Define it in .env.local');
    }

    const { currentPassword, newPassword } = await request.json();

    // TODO: replace with logged-in username from your auth/session logic
    const username = ADMIN_USERNAME;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection({
      uri: DATABASE_URL,
      ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : undefined,
    });

    const [rows] = await connection.execute('SELECT id, password FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      await connection.end();
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await connection.execute('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username]);
    await connection.end();

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
