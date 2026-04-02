-- =============================================
-- QAA AI Chatbot - Database Schema
-- PostgreSQL 15 | Cloud SQL (me-central1)
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. ENUMS
-- =============================================

CREATE TYPE user_type AS ENUM ('anonymous', 'verified_student', 'agent', 'supervisor', 'admin');
CREATE TYPE channel_type AS ENUM ('whatsapp_registration', 'whatsapp_student_affairs', 'website_widget');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_type AS ENUM ('text', 'voice', 'image', 'document', 'template', 'interactive', 'system');
CREATE TYPE conversation_status AS ENUM ('active', 'waiting_agent', 'agent_handling', 'resolved', 'expired');
CREATE TYPE ticket_status AS ENUM ('open', 'assigned', 'in_progress', 'pending_response', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_department AS ENUM ('registration', 'student_affairs', 'finance', 'it_support', 'training', 'administration');
CREATE TYPE language_type AS ENUM ('en', 'ar');
CREATE TYPE escalation_reason AS ENUM ('low_confidence', 'user_requested', 'sensitive_query', 'repeated_failure', 'after_hours');
CREATE TYPE agent_status AS ENUM ('online', 'busy', 'away', 'offline');
CREATE TYPE kb_content_source AS ENUM ('excel_import', 'website_crawl', 'brochure', 'manual_entry');

-- =============================================
-- 2. USERS & STUDENTS
-- =============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE,
    student_id VARCHAR(50) UNIQUE,
    user_type user_type NOT NULL DEFAULT 'anonymous',
    display_name VARCHAR(255),
    email VARCHAR(255),
    preferred_language language_type DEFAULT 'en',
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_type ON users(user_type);

-- =============================================
-- 3. AGENTS (Live support)
-- =============================================

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department ticket_department NOT NULL,
    status agent_status DEFAULT 'offline',
    max_concurrent_chats INT DEFAULT 5,
    active_chats INT DEFAULT 0,
    is_supervisor BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_department ON agents(department);

-- =============================================
-- 4. CONVERSATIONS
-- =============================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    channel channel_type NOT NULL,
    status conversation_status DEFAULT 'active',
    language language_type DEFAULT 'en',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    escalated_at TIMESTAMPTZ,
    escalation_reason escalation_reason,
    ai_confidence_avg FLOAT,
    message_count INT DEFAULT 0,
    is_after_hours BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_channel ON conversations(channel);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

-- =============================================
-- 5. MESSAGES
-- =============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction message_direction NOT NULL,
    message_type message_type DEFAULT 'text',
    content TEXT,
    content_ar TEXT,
    media_url VARCHAR(1024),
    whatsapp_message_id VARCHAR(255),
    ai_confidence FLOAT,
    ai_intent VARCHAR(255),
    ai_matched_faq_id UUID,
    voice_transcript TEXT,
    voice_language language_type,
    is_escalation_trigger BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_whatsapp_id ON messages(whatsapp_message_id);
CREATE INDEX idx_messages_intent ON messages(ai_intent);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- =============================================
-- 6. KNOWLEDGE BASE - CATEGORIES (Decision Tree)
-- =============================================

CREATE TABLE kb_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES kb_categories(id) ON DELETE CASCADE,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    channel channel_type NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    depth INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_categories_parent ON kb_categories(parent_id);
CREATE INDEX idx_kb_categories_channel ON kb_categories(channel);

-- =============================================
-- 7. KNOWLEDGE BASE - FAQ ENTRIES
-- =============================================

CREATE TABLE kb_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES kb_categories(id) ON DELETE SET NULL,
    question_en TEXT NOT NULL,
    question_ar TEXT NOT NULL,
    answer_en TEXT NOT NULL,
    answer_ar TEXT NOT NULL,
    keywords_en TEXT[],
    keywords_ar TEXT[],
    source kb_content_source DEFAULT 'manual_entry',
    source_url VARCHAR(1024),
    channel channel_type NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    hit_count INT DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    version INT DEFAULT 1,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_entries_category ON kb_entries(category_id);
CREATE INDEX idx_kb_entries_channel ON kb_entries(channel);
CREATE INDEX idx_kb_entries_active ON kb_entries(is_active);
CREATE INDEX idx_kb_entries_keywords_en ON kb_entries USING GIN(keywords_en);
CREATE INDEX idx_kb_entries_keywords_ar ON kb_entries USING GIN(keywords_ar);

-- Full-text search indexes
CREATE INDEX idx_kb_entries_fts_en ON kb_entries USING GIN(to_tsvector('english', question_en || ' ' || answer_en));

-- =============================================
-- 8. KNOWLEDGE BASE - VERSION HISTORY
-- =============================================

CREATE TABLE kb_entry_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID NOT NULL REFERENCES kb_entries(id) ON DELETE CASCADE,
    question_en TEXT,
    question_ar TEXT,
    answer_en TEXT,
    answer_ar TEXT,
    version INT NOT NULL,
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kb_history_entry ON kb_entry_history(entry_id, version DESC);

-- =============================================
-- 9. TICKETS
-- =============================================

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number SERIAL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    department ticket_department NOT NULL,
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'medium',
    subject VARCHAR(500),
    description TEXT,
    channel channel_type NOT NULL,
    escalation_reason escalation_reason,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    first_response_at TIMESTAMPTZ,
    external_ticket_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_department ON tickets(department);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_agent ON tickets(assigned_agent_id);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);

-- =============================================
-- 10. FEEDBACK
-- =============================================

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    channel channel_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_conversation ON feedback(conversation_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);

-- =============================================
-- 11. AUDIT LOG
-- =============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- =============================================
-- 12. WEBHOOK LOGS (360dialog inbound/outbound)
-- =============================================

CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    direction message_direction NOT NULL,
    channel channel_type NOT NULL,
    payload JSONB NOT NULL,
    status_code INT,
    error_message TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed) WHERE NOT processed;

-- =============================================
-- 13. SYSTEM CONFIG
-- =============================================

CREATE TABLE system_config (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default configs
INSERT INTO system_config (key, value, description) VALUES
    ('office_hours', '{"start": "07:00", "end": "16:00", "timezone": "Asia/Qatar", "days": [0,1,2,3,4]}', 'Office hours for live agent availability (Sun-Thu)'),
    ('ai_confidence_threshold', '{"escalation": 0.4, "warning": 0.6, "auto_respond": 0.8}', 'AI confidence thresholds'),
    ('max_agent_chats', '{"default": 5, "supervisor": 10}', 'Max concurrent chats per agent'),
    ('disclaimer_en', '"This is an AI-powered assistant. Responses are for informational purposes only. For official decisions, please contact the relevant department directly."', 'English disclaimer'),
    ('disclaimer_ar', '"هذا مساعد مدعوم بالذكاء الاصطناعي. الردود لأغراض إعلامية فقط. للقرارات الرسمية، يرجى الاتصال بالقسم المعني مباشرة."', 'Arabic disclaimer');

-- =============================================
-- 14. UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_kb_categories_updated BEFORE UPDATE ON kb_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_kb_entries_updated BEFORE UPDATE ON kb_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
