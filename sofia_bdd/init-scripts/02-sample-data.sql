-- Sample data for testing Eliza database
-- This script inserts some initial data for development and testing

\c eliza_db;

SET search_path TO eliza, public;

-- Insert sample users
INSERT INTO eliza.users (username, user_type, preferences, metadata) VALUES
    ('eliza_agent', 'agent', '{"language": "fr", "model": "gpt-4"}', '{"version": "1.0.0"}'),
    ('test_user', 'human', '{"language": "fr", "notifications": true}', '{"source": "test"}')
ON CONFLICT (username) DO NOTHING;

-- Insert sample conversation
INSERT INTO eliza.conversations (user_id, context, metadata, status) VALUES
    ('test_user', '{"topic": "introduction", "language": "fr"}', '{"source": "web"}', 'active');

-- Get the conversation ID for messages
DO $$
DECLARE
    conv_id UUID;
BEGIN
    SELECT id INTO conv_id FROM eliza.conversations WHERE user_id = 'test_user' LIMIT 1;

    IF conv_id IS NOT NULL THEN
        -- Insert sample messages
        INSERT INTO eliza.messages (conversation_id, role, content, metadata) VALUES
            (conv_id, 'user', 'Bonjour, qui es-tu?', '{"timestamp": "2025-01-13T10:00:00Z"}'),
            (conv_id, 'assistant', 'Bonjour! Je suis Eliza, une intelligence artificielle conçue pour vous aider.', '{"timestamp": "2025-01-13T10:00:05Z"}');

        -- Insert sample memory
        INSERT INTO eliza.memories (user_id, conversation_id, memory_type, content, importance_score) VALUES
            ('test_user', conv_id, 'user_preference', 'Préfère communiquer en français', 0.8);
    END IF;
END $$;

-- Log initialization
INSERT INTO logs.system_logs (level, message, context) VALUES
    ('INFO', 'Sample data inserted successfully', '{"script": "02-sample-data.sql"}');

DO $$
BEGIN
    RAISE NOTICE 'Sample data inserted successfully!';
END $$;
