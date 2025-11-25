-- Initialization script for Eliza database
-- This script runs automatically when the container starts for the first time

\c eliza_db;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS eliza;
CREATE SCHEMA IF NOT EXISTS logs;

-- Set search path
SET search_path TO eliza, public;

-- ============================================
-- CORE TABLES FOR ELIZA
-- ============================================

-- Conversations table
CREATE TABLE IF NOT EXISTS eliza.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    context JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'active',
    CONSTRAINT valid_status CHECK (status IN ('active', 'archived', 'deleted'))
);

-- Messages table
CREATE TABLE IF NOT EXISTS eliza.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES eliza.conversations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding TEXT, -- For vector similarity search (store as JSON text until pgvector is installed)
    CONSTRAINT valid_role CHECK (role IN ('user', 'assistant', 'system'))
);

-- Memory/Knowledge base table
CREATE TABLE IF NOT EXISTS eliza.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    conversation_id UUID REFERENCES eliza.conversations(id) ON DELETE SET NULL,
    memory_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    importance_score FLOAT DEFAULT 0.5,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_importance CHECK (importance_score >= 0 AND importance_score <= 1)
);

-- Users/Agents table
CREATE TABLE IF NOT EXISTS eliza.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(255) UNIQUE NOT NULL,
    user_type VARCHAR(50) DEFAULT 'human',
    preferences JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_user_type CHECK (user_type IN ('human', 'agent', 'system'))
);

-- Actions/Tools execution log
CREATE TABLE IF NOT EXISTS eliza.actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    conversation_id UUID REFERENCES eliza.conversations(id) ON DELETE CASCADE,
    action_name VARCHAR(255) NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    execution_time_ms INTEGER,
    CONSTRAINT valid_action_status CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON eliza.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON eliza.conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON eliza.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_metadata ON eliza.conversations USING gin(metadata);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON eliza.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON eliza.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON eliza.messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_content_trgm ON eliza.messages USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON eliza.messages USING gin(metadata);

-- Memories indexes
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON eliza.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_conversation_id ON eliza.memories(conversation_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON eliza.memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON eliza.memories(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_memories_last_accessed ON eliza.memories(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_content_trgm ON eliza.memories USING gin(content gin_trgm_ops);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON eliza.users(username);
CREATE INDEX IF NOT EXISTS idx_users_type ON eliza.users(user_type);

-- Actions indexes
CREATE INDEX IF NOT EXISTS idx_actions_conversation_id ON eliza.actions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_actions_name ON eliza.actions(action_name);
CREATE INDEX IF NOT EXISTS idx_actions_status ON eliza.actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON eliza.actions(created_at DESC);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION eliza.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON eliza.conversations
    FOR EACH ROW
    EXECUTE FUNCTION eliza.update_updated_at_column();

CREATE TRIGGER update_memories_updated_at
    BEFORE UPDATE ON eliza.memories
    FOR EACH ROW
    EXECUTE FUNCTION eliza.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON eliza.users
    FOR EACH ROW
    EXECUTE FUNCTION eliza.update_updated_at_column();

-- Function to increment memory access count
CREATE OR REPLACE FUNCTION eliza.increment_memory_access()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.access_count IS DISTINCT FROM NEW.access_count THEN
        NEW.access_count = OLD.access_count + 1;
        NEW.last_accessed_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- LOGGING TABLES
-- ============================================

-- System logs
CREATE TABLE IF NOT EXISTS logs.system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_log_level CHECK (level IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON logs.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON logs.system_logs(created_at DESC);

-- ============================================
-- GRANTS AND PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA eliza TO PUBLIC;
GRANT USAGE ON SCHEMA logs TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA eliza TO eliza;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA logs TO eliza;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA eliza TO eliza;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA logs TO eliza;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Eliza database initialized successfully!';
END $$;
