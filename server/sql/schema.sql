CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(32) UNIQUE NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    bio TEXT DEFAULT '',
    location VARCHAR(120) DEFAULT '',
    photo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

<<<<<<< HEAD
CREATE TABLE IF NOT EXISTS profile_photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(32) NOT NULL,
    photo_url TEXT NOT NULL,
    filter_style VARCHAR(120),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_photos_username ON profile_photos(username);

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS primary_photo_id INTEGER REFERENCES profile_photos(id);

=======
>>>>>>> 656fd6bf657cb4b3c8a5efca23efa63605b7193f
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender VARCHAR(32) NOT NULL,
    recipient VARCHAR(32),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages (sender, recipient, created_at);
<<<<<<< HEAD

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    reaction_like INTEGER DEFAULT 0,
    reaction_love INTEGER DEFAULT 0,
    reaction_haha INTEGER DEFAULT 0,
    reaction_fire INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    username VARCHAR(32) NOT NULL,
    PRIMARY KEY (post_id, username)
);

CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    username VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
=======
>>>>>>> 656fd6bf657cb4b3c8a5efca23efa63605b7193f
