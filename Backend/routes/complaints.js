const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { complaints, users } = require('../db/schema');
const { generateFollowUpQuestion } = require('../services/ai');
const { authenticate, isAdmin } = require('../middleware/auth');
const { eq } = require('drizzle-orm');

// POST /api/ai/question
router.post('/ai/question', authenticate, async (req, res) => {
    const { complaint_text } = req.body;
    if (!complaint_text) {
        return res.status(400).json({ error: 'Complaint text is required' });
    }

    try {
        const question = await generateFollowUpQuestion(complaint_text);
        res.json({ question });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate AI question' });
    }
});

// POST /api/complaints
router.post('/complaints', authenticate, async (req, res) => {
    const { complaint_text, ai_question, ai_answer } = req.body;
    if (!complaint_text) {
        return res.status(400).json({ error: 'Complaint text is required' });
    }

    try {
        const [newComplaint] = await db.insert(complaints).values({
            user_id: req.user.id,
            complaint_text,
            ai_question,
            user_answer: ai_answer,
        }).returning();

        res.json(newComplaint);
    } catch (error) {
        console.error('Error creating complaint:', error);
        res.status(500).json({ error: 'Failed to submit complaint' });
    }
});

// GET /api/complaints/my
router.get('/complaints/my', authenticate, async (req, res) => {
    try {
        const userComplaints = await db.select().from(complaints).where(eq(complaints.user_id, req.user.id));
        res.json(userComplaints);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch complaints' });
    }
});

// GET /api/admin/complaints
router.get('/admin/complaints', authenticate, isAdmin, async (req, res) => {
    try {
        const allComplaints = await db.select({
            id: complaints.id,
            complaint_text: complaints.complaint_text,
            ai_question: complaints.ai_question,
            user_answer: complaints.user_answer,
            created_at: complaints.created_at,
            userName: users.name,
            userEmail: users.email
        })
        .from(complaints)
        .leftJoin(users, eq(complaints.user_id, users.id));

        res.json(allComplaints);
    } catch (error) {
        console.error('Error fetching admin complaints:', error);
        res.status(500).json({ error: 'Failed to fetch all complaints' });
    }
});

module.exports = router;
