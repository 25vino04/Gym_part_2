import express from "express";
import { PostModel } from "../models/PostModel.mjs";

export class BlogController {
    static routes = express.Router();

    static {
        this.routes.get("/blog", this.viewBlog);
        this.routes.post("/blog/create", this.createPost);
        this.routes.post("/blog/:id/delete", this.deletePost);
    }

    static async viewBlog(req, res) {
        try {
            const posts = await PostModel.getAllPublishedWithAuthors();

            res.render("blog", {
                posts,
                error: null,
                success: null,
                user: req.session.user || null
            });
        } catch (error) {
            console.error("Blog view error:", error);
            res.status(500).render("blog", {
                posts: [],
                error: "Failed to load blog posts",
                success: null,
                user: req.session.user || null
            });
        }
    }

    static async createPost(req, res) {

        if (!req.session.user || !['member', 'trainer', 'admin'].includes(req.session.user.role)) {
            return res.redirect("/login");
        }

        const { title, content } = req.body;

        if (!title || !content) {
            const posts = await PostModel.getAllPublishedWithAuthors();
            return res.render("blog", {
                posts,
                error: "Title and content are required",
                success: null,
                user: req.session.user || null
            });
        }

        try {
            await PostModel.create({
                user_id: req.session.user.id,
                title: title.trim(),
                content: content.trim(),
                category: "general",
                tags: "[]",
                is_featured: false,
                comments_count: 0,
                status: "published",
                published_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            });

            const posts = await PostModel.getAllPublishedWithAuthors();
            return res.render("blog", {
                posts,
                error: null,
                success: "Post published successfully!",
                user: req.session.user || null
            });

        } catch (error) {
            console.error("Create post error:", error);
            const posts = await PostModel.getAllPublishedWithAuthors();
            return res.render("blog", {
                posts,
                error: "Failed to create post",
                success: null,
                user: req.session.user || null
            });
        }
    }

    static async deletePost(req, res) {
        const postId = req.params.id;

        if (!req.session.user) {
            return res.redirect("/login");
        }

        try {
            const post = await PostModel.getById(postId);


            const isOwner = post.user_id === req.session.user.id;
            const isAdmin = req.session.user.role === 'admin';

            if (!isOwner && !isAdmin) {
                const posts = await PostModel.getAllPublishedWithAuthors();
                return res.render("blog", {
                    posts,
                    error: "You don't have permission to delete this post",
                    success: null,
                    user: req.session.user || null
                });
            }

            await PostModel.delete(postId);

            const posts = await PostModel.getAllPublishedWithAuthors();
            return res.render("blog", {
                posts,
                error: null,
                success: "Post deleted successfully",
                user: req.session.user || null
            });

        } catch (error) {
            console.error("Delete post error:", error);
            const posts = await PostModel.getAllPublishedWithAuthors();
            return res.render("blog", {
                posts,
                error: "Failed to delete post",
                success: null,
                user: req.session.user || null
            });
        }
    }
}