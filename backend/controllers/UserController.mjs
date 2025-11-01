import express from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/UserModel.mjs";

export class UserController {
    static routes = express.Router();

    static {
        this.routes.get("/", this.viewAdmin);
        this.routes.get("/:id", this.viewAdmin);
        this.routes.post("/", this.handleAdmin);
        this.routes.post("/:id", this.handleAdmin);
        this.routes.post("/:id/delete", this.handleDelete);
    }



    static validateEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateAustralianPhone(phone) {
        if (!phone) return true;
        const cleanPhone = phone.replace(/\s/g, '');
        const format1 = /^\+61\d{9}$/.test(cleanPhone);
        const format2 = /^0\d{9}$/.test(cleanPhone);
        return format1 || format2;
    }

    static validateUserData(data, isUpdate = false) {
        const errors = [];

        if (!data.email || data.email.trim().length === 0) {
            errors.push("Email is required");
        } else if (!UserController.validateEmail(data.email)) {
            errors.push("Please enter a valid email address (must contain @)");
        }

        if (!data.first_name || data.first_name.trim().length === 0) {
            errors.push("First name is required");
        } else if (data.first_name.trim().length < 2) {
            errors.push("First name must be at least 2 characters");
        }

        if (!data.last_name || data.last_name.trim().length === 0) {
            errors.push("Last name is required");
        } else if (data.last_name.trim().length < 2) {
            errors.push("Last name must be at least 2 characters");
        }

        if (!isUpdate && (!data.password || data.password.length < 8)) {
            errors.push("Password must be at least 8 characters long");
        }

        if (data.phone && !UserController.validateAustralianPhone(data.phone)) {
            errors.push("Phone must be in format +61XXXXXXXXX (9 digits) or 0XXXXXXXXX (10 digits total)");
        }

        if (data.emergency_phone && !UserController.validateAustralianPhone(data.emergency_phone)) {
            errors.push("Emergency phone must be in format +61XXXXXXXXX or 0XXXXXXXXX");
        }

        return errors;
    }



    static async viewAdmin(req, res) {
        try {
            const selectedId = req.params.id;


            const filterRole = req.query.role || '';
            const filterSearch = req.query.search || '';


            let users = await UserModel.getAll();


            if (filterRole) {
                users = users.filter(u => u.role === filterRole);
            }

            if (filterSearch) {
                const search = filterSearch.toLowerCase();
                users = users.filter(u =>
                    u.first_name?.toLowerCase().includes(search) ||
                    u.last_name?.toLowerCase().includes(search) ||
                    u.email?.toLowerCase().includes(search)
                );
            }

            const selectedUser = users.find(u => u.id == selectedId) ?? {
                id: null, email: "", password: "", role: "member",
                first_name: "", last_name: "", phone: "",
                emergency_contact: "", emergency_phone: "", medical_notes: "",
                membership_start: null, membership_end: null
            };

            const success = req.query.success || null;
            const errors = [];

            res.render("users_admin.ejs", {
                users,
                selectedUser,
                success,
                errors,
                filterRole,
                filterSearch
            });
        } catch (e) {
            console.error(e);
            res.status(500).render("status.ejs", {
                status: "Error",
                message: "Cannot load users.",
                user: req.session.user || null
            });
        }
    }



    static async handleAdmin(req, res) {
        const id = req.params.id;
        const f = req.body;
        const action = f.action;

        console.log('=== USER ADMIN ACTION ===');
        console.log('Action:', action);
        console.log('User ID:', id);

        const isUpdate = action === 'update';
        const validationErrors = UserController.validateUserData(f, isUpdate);

        if (validationErrors.length > 0) {
            const users = await UserModel.getAll();
            return res.render("users_admin.ejs", {
                users,
                selectedUser: { id, ...f },
                errors: validationErrors,
                user: req.session.user || null,
                success: null
            });
        }

        try {
            if (action === "create") {
                const password = bcrypt.hashSync(f.password, 10);
                const dto = {
                    email: f.email.trim(),
                    password: password,
                    role: f.role || "member",
                    first_name: f.first_name.trim(),
                    last_name: f.last_name.trim(),
                    phone: f.phone?.trim() || null,
                    emergency_contact: f.emergency_contact?.trim() || "",
                    emergency_phone: f.emergency_phone?.trim() || null,
                    medical_notes: f.medical_notes?.trim() || "",
                    membership_start: f.membership_start || null,
                    membership_end: f.membership_end || null
                };

                await UserModel.create(dto);
                return res.redirect("/users");
            }

            if (action === "update") {
                const dto = {
                    id,
                    email: f.email.trim(),
                    role: f.role || "member",
                    first_name: f.first_name.trim(),
                    last_name: f.last_name.trim(),
                    phone: f.phone?.trim() || null,
                    emergency_contact: f.emergency_contact?.trim() || "",
                    emergency_phone: f.emergency_phone?.trim() || null,
                    medical_notes: f.medical_notes?.trim() || "",
                    membership_start: f.membership_start || null,
                    membership_end: f.membership_end || null
                };

                if (f.password && f.password.trim().length > 0) {
                    const hashedPassword = bcrypt.hashSync(f.password, 10);
                    await UserModel.updatePassword(id, hashedPassword);
                }

                await UserModel.update(dto);
                return res.redirect("/users");
            }

            return res.status(400).render("status", {
                status: "Invalid action",
                message: "Unsupported action.",
                user: req.session.user || null
            });
        } catch (e) {
            console.error("Error in handleAdmin:", e);

            if (e.code === 'ER_DUP_ENTRY') {
                const users = await UserModel.getAll();
                return res.render("users_admin.ejs", {
                    users,
                    selectedUser: { id, ...f },
                    errors: ["This email is already registered"],
                    user: req.session.user || null,
                    success: null
                });
            }

            res.status(500).render("status", {
                status: "DB error",
                message: "User operation failed: " + e.message,
                user: req.session.user || null
            });
        }
    }



    static async handleDelete(req, res) {
        const id = req.params.id;

        console.log('===========================================');
        console.log('=== DELETING USER ===');
        console.log('User ID to delete:', id);

        try {

            console.log('Deleting related bookings...');
            await UserModel.query("DELETE FROM bookings WHERE member_id = ?", [id]);


            try {
                console.log('Checking for blog posts...');
                await UserModel.query("DELETE FROM blog_posts WHERE author_id = ?", [id]);
                console.log('Blog posts deleted');
            } catch (blogError) {
                console.log('No blog_posts table or no posts to delete:', blogError.message);

            }

            console.log('Now deleting user...');
            const result = await UserModel.delete(id);
            console.log('Delete result:', result);

            if (result.affectedRows > 0) {
                console.log('✅ User deleted successfully');
                return res.redirect("/users?success=user_deleted");
            }

            console.log('❌ User not found');
            return res.status(404).render("status", {
                status: "Not found",
                message: "User not found.",
                user: req.session.user || null
            });
        } catch (error) {
            console.error('❌ Error during delete:', error);
            return res.status(500).render("status", {
                status: "Delete failed",
                message: "Could not delete user: " + error.message,
                user: req.session.user || null
            });
        }
    }
}