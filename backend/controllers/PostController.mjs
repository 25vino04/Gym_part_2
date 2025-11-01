import express from "express";
import { PostModel } from "../models/PostModel.mjs";
import { UserModel } from "../models/UserModel.mjs";

export class PostController {
    static routes = express.Router();

    static {
        this.routes.get("/", this.viewAdmin);
        this.routes.get("/:id", this.viewAdmin);
        this.routes.post("/", this.handleAdmin);
        this.routes.post("/:id", this.handleAdmin);

        this.routes.post("/:id/delete", this.handleDelete);
    }

    static async viewAdmin(req, res) {
        try {
            const selectedId = req.params.id;


            const filterStatus = req.query.status || '';
            const filterAuthor = req.query.author || '';
            const filterSearch = req.query.search || '';
            const filterCreatedDate = req.query.createdDate || '';

            let posts = await PostModel.getAllWithAuthors();
            const users = await UserModel.getAll();


            if (filterStatus) {
                posts = posts.filter(p => p.status === filterStatus);
            }

            if (filterAuthor) {
                posts = posts.filter(p => p.user_id == filterAuthor);
            }

            if (filterSearch) {
                const search = filterSearch.toLowerCase();
                posts = posts.filter(p =>
                    p.title?.toLowerCase().includes(search) ||
                    p.content?.toLowerCase().includes(search) ||
                    p.author_name?.toLowerCase().includes(search));
            }
            if (filterCreatedDate) {
                posts = posts.filter(p => {
                    const pDate = p.created_date ? new Date(p.created_date).toISOString().split('T')[0] :
                        new Date(p.created_at).toISOString().split('T')[0];
                    return pDate === filterCreatedDate;
                });
            }



            const selectedPost = posts.find(p => p.id == selectedId) ?? {
                id: null,
                user_id: "",
                title: "",
                content: "",
                status: "draft"
            };

            const success = req.query.success || null;
            const error = req.query.error || null;

            res.render("posts_admin.ejs", {
                posts,
                selectedPost,
                users,
                success,
                error,
                filterStatus,
                filterAuthor,
                filterSearch,
                filterCreatedDate
            });
        } catch (e) {
            console.error(e);
            res.status(500).render("status.ejs", {
                status: "Error",
                message: "Cannot load posts.",
                user: req.session.user || null
            });
        }
    }


    static async handleAdmin(req, res) {
        const id = req.params.id;
        const f = req.body;
        const action = f.action;

        const dto = {
            id,
            user_id: Number(f.user_id),
            title: f.title?.trim(),
            content: f.content?.trim(),
            status: f.status || "draft",
            category: "general",
            tags: "[]",
            is_featured: false,
            comments_count: 0,
            published_at: f.status === 'published' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
        };

        try {
            if (action === "create") {
                await PostModel.create(dto);
                return res.redirect("/posts?success=post_created");
            }
            if (action === "update") {
                await PostModel.update(dto);
                return res.redirect("/posts?success=post_updated");
            }
            if (action === "delete") {
                await PostModel.delete(id);
                return res.redirect("/posts?success=post_deleted");
            }
            return res.status(400).render("status.ejs", {
                status: "Invalid action",
                message: "Unsupported action.",
                user: req.session.user || null
            });
        } catch (e) {
            console.error(e);
            res.status(500).render("status.ejs", {
                status: "DB error",
                message: "Post operation failed.",
                user: req.session.user || null
            });
        }
    }


    static async handleDelete(req, res) {
        const id = req.params.id;
        console.log(' DELETE REQUEST received for post ID:', id);
        try {
            const result = await PostModel.delete(id);
            console.log('✅ Delete successful:', result);
            res.redirect("/posts?success=post_deleted");
        } catch (e) {
            console.error('❌ Delete error:', e);
            res.redirect("/posts?error=delete_failed");
        }
    }
}