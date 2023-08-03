// Create web server

// Import modules
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import models
const Comment = require('../models/Comment');
const User = require('../models/User');
const Post = require('../models/Post');

// Import middleware
const auth = require('../middleware/auth');

// @route   POST api/comments
// @desc    Create a comment
// @access  Private
router.post(
    '/',
    [
        auth,
        [
            check('text', 'Text is required').not().isEmpty(),
            check('post', 'Post is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
            });
        }

        // Destructure request body
        const { text, post } = req.body;

        try {
            // Check if post exists
            const postExists = await Post.findById(post);
            if (!postExists) {
                return res.status(404).json({
                    errors: [
                        {
                            msg: 'Post not found',
                        },
                    ],
                });
            }

            // Check if user exists
            const userExists = await User.findById(req.user.id);
            if (!userExists) {
                return res.status(404).json({
                    errors: [
                        {
                            msg: 'User not found',
                        },
                    ],
                });
            }

            // Create comment
            const comment = new Comment({
                text,
                post,
                user: req.user.id,
            });

            // Save comment
            await comment.save();

            // Add comment to post
            postExists.comments.unshift(comment);
            await postExists.save();

            // Return comment
            res.json(comment);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);