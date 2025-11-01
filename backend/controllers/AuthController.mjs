import express from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/UserModel.mjs";

export class AuthController {
    static routes = express.Router();

    static {
        this.routes.get("/login", this.showLogin);
        this.routes.post("/login", this.handleLogin);
        this.routes.get("/register", this.showRegister);
        this.routes.post("/register", this.handleRegister);
        this.routes.get("/logout", this.handleLogout);
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


    static showLogin(req, res) {
        res.render("login", {
            error: req.query.error || null,
            success: req.query.success ? "Registration successful! Please login." : null
        });
    }

    static async handleLogin(req, res) {
        const { email, password } = req.body;

        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', email);

        try {
            const user = await UserModel.getByEmail(email);

            if (!user) {
                console.log('User not found');
                return res.render("login", {
                    error: "Invalid email or password",
                    success: null
                });
            }

            const passwordMatch = bcrypt.compareSync(password, user.password);
            console.log('Password match:', passwordMatch);

            if (!passwordMatch) {
                console.log('Password mismatch');
                return res.render("login", {
                    error: "Invalid email or password",
                    success: null
                });
            }


            req.session.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name
            };

            console.log('Session created:', req.session.user);


            if (user.role === "admin") {
                return res.redirect("/admin/dashboard");
            } else if (user.role === "trainer") {
                return res.redirect("/trainer-dashboard");
            } else {
                return res.redirect("/member-dashboard");
            }

        } catch (error) {
            console.error("Login error:", error);
            return res.render("login", {
                error: "Invalid email or password",
                success: null
            });
        }
    }



    static showRegister(req, res) {
        res.render("register", {
            error: null,
            errors: [],
            formData: {}
        });
    }

    static async handleRegister(req, res) {
        const { email, password, confirm_password, first_name, last_name, phone } = req.body;

        const errors = [];


        if (!email || email.trim().length === 0) {
            errors.push("Email is required");
        } else if (!AuthController.validateEmail(email)) {  // ИСПРАВЛЕНО: используем имя класса
            errors.push("Please enter a valid email address (must contain @)");
        }


        if (!first_name || first_name.trim().length === 0) {
            errors.push("First name is required");
        } else if (first_name.trim().length < 2) {
            errors.push("First name must be at least 2 characters");
        }


        if (!last_name || last_name.trim().length === 0) {
            errors.push("Last name is required");
        } else if (last_name.trim().length < 2) {
            errors.push("Last name must be at least 2 characters");
        }


        if (!password || password.length === 0) {
            errors.push("Password is required");
        } else if (password.length < 8) {
            errors.push("Password must be at least 8 characters");
        }


        if (!confirm_password || confirm_password !== password) {
            errors.push("Passwords do not match");
        }


        if (phone && phone.trim().length > 0 && !AuthController.validateAustralianPhone(phone)) {
            errors.push("Phone must be in format +61XXXXXXXXX (9 digits) or 0XXXXXXXXX (10 digits total)");
        }


        if (errors.length > 0) {
            return res.render("register", {
                error: null,
                errors: errors,
                formData: req.body
            });
        }

        try {

            try {
                const existingUser = await UserModel.getByEmail(email);
                if (existingUser) {
                    return res.render("register", {
                        error: "Email already registered",
                        errors: [],
                        formData: req.body
                    });
                }
            } catch (e) {

            }


            const hashedPassword = bcrypt.hashSync(password, 10);


            const today = new Date().toISOString().split('T')[0];
            const oneYearLater = new Date();
            oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
            const membershipEnd = oneYearLater.toISOString().split('T')[0];


            await UserModel.create({
                email: email.trim(),
                password: hashedPassword,
                role: "member",
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                phone: phone?.trim() || null,
                emergency_contact: "",
                emergency_phone: null,
                medical_notes: "",
                membership_start: today,
                membership_end: membershipEnd
            });

            console.log('User registered successfully:', email);


            return res.redirect("/login?success=registered");

        } catch (error) {
            console.error("Registration error:", error);


            if (error.code === 'ER_DUP_ENTRY') {
                return res.render("register", {
                    error: "Email already registered",
                    errors: [],
                    formData: req.body
                });
            }

            return res.render("register", {
                error: "Registration failed. Please try again.",
                errors: [],
                formData: req.body
            });
        }
    }


    static handleLogout(req, res) {
        req.session.destroy();
        res.redirect("/");
    }
}