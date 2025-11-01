import { DatabaseModel } from "./DatabaseModel.mjs";
import bcrypt from "bcryptjs";

export class UserModel extends DatabaseModel {
  constructor(id, email, password, role, first_name, last_name, phone,
    emergency_contact, emergency_phone, medical_notes,
    membership_start, membership_end, created_at, updated_at) {
    super();
    this.id = id;
    this.email = email;
    this.password = password;
    this.role = role;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
    this.emergency_contact = emergency_contact;
    this.emergency_phone = emergency_phone;
    this.medical_notes = medical_notes;
    this.membership_start = membership_start;
    this.membership_end = membership_end;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static tableToModel(row) {
    const r = row.users;
    return new UserModel(
      r.id, r.email, r.password, r.role, r.first_name, r.last_name, r.phone,
      r.emergency_contact, r.emergency_phone, r.medical_notes,
      r.membership_start, r.membership_end, r.created_at, r.updated_at
    );
  }

  static async getAll() {
    return this.query("SELECT * FROM users").then(rows =>
      rows.map(row => this.tableToModel(row))
    );
  }

  static async getById(id) {
    return this.query("SELECT * FROM users WHERE id = ?", [id]).then(rows =>
      rows.length ? this.tableToModel(rows[0]) : Promise.reject("not found")
    );
  }

  static async getByEmail(email) {
    return this.query("SELECT * FROM users WHERE email = ?", [email]).then(rows =>
      rows.length ? this.tableToModel(rows[0]) : Promise.reject("not found")
    );
  }

  static async create(u) {
    return this.query(
      `INSERT INTO users
             (email, password, role, first_name, last_name, phone, emergency_contact, emergency_phone,
              medical_notes, membership_start, membership_end)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.email, u.password, u.role, u.first_name, u.last_name, u.phone,
      u.emergency_contact, u.emergency_phone, u.medical_notes,
      u.membership_start, u.membership_end]
    );
  }

  static async update(u) {

    return this.query(
      `UPDATE users
             SET email=?, role=?, first_name=?, last_name=?, phone=?, emergency_contact=?, emergency_phone=?,
                 medical_notes=?, membership_start=?, membership_end=?
             WHERE id=?`,
      [u.email, u.role, u.first_name, u.last_name, u.phone,
      u.emergency_contact, u.emergency_phone, u.medical_notes,
      u.membership_start, u.membership_end, u.id]
    );
  }

  static async updatePassword(id, hashedPassword) {
    return this.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, id]
    );
  }

  static async delete(id) {
    return this.query("DELETE FROM users WHERE id = ?", [id]).then(r =>
      r.affectedRows ? r : Promise.reject("not found")
    );
  }
}