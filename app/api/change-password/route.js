import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
<<<<<<< HEAD
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

=======
import Database from 'better-sqlite3';
import path from 'path';

// Initialize database connection
// ADJUST THIS PATH to match where your database file is located!
const dbPath = path.join(process.cwd(), 'database.db'); // Change 'database.db' to your actual filename
const db = new Database(dbPath);

export async function POST(request) {
  try {
    const { currentPassword, newPassword } = await request.json();

    // TODO: Get the current user from your authentication/session
    // Replace 'admin' with the actual logged-in username
    // Examples:
    // - const session = await getServerSession(authOptions);
    // - const username = session.user.username;
    // - OR if you have user ID in cookies/headers
    const username = 'admin'; // CHANGE THIS to get from your auth system

    // Validate input
>>>>>>> 656fd6bf657cb4b3c8a5efca23efa63605b7193f
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

<<<<<<< HEAD
    const connection = await mysql.createConnection({
      uri: DATABASE_URL,
      ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : undefined,
    });

    const [rows] = await connection.execute('SELECT id, password FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      await connection.end();
=======
    // Query user from database
    // ADJUST the table and column names to match your database schema!
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
>>>>>>> 656fd6bf657cb4b3c8a5efca23efa63605b7193f
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

<<<<<<< HEAD
    const user = rows[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      await connection.end();
=======
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
>>>>>>> 656fd6bf657cb4b3c8a5efca23efa63605b7193f
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

<<<<<<< HEAD
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await connection.execute('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username]);
    await connection.end();
=======
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    // ADJUST the table and column names to match your database schema!
    db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashedPassword, username);
>>>>>>> 656fd6bf657cb4b3c8a5efca23efa63605b7193f

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
