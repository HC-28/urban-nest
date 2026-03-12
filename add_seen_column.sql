-- Migration: Add 'seen' column to chat_messages
-- Run this if you are getting 500 errors in the chat system.

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS seen BOOLEAN DEFAULT FALSE NOT NULL;
