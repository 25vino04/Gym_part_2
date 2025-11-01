
import { DatabaseModel } from "./DatabaseModel.mjs";

export class BookingModel extends DatabaseModel {
  constructor(id, session_id, member_id, booking_date, status, cancellation_reason,
    cancelled_at, checked_in, check_in_time, notes, created_at, updated_at) {
    super();
    this.id = id;
    this.session_id = session_id;
    this.member_id = member_id;
    this.booking_date = booking_date;
    this.status = status;
    this.cancellation_reason = cancellation_reason;
    this.cancelled_at = cancelled_at;
    this.checked_in = checked_in;
    this.check_in_time = check_in_time;
    this.notes = notes;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static tableToModel(row) {
    const r = row.bookings;
    return new BookingModel(
      r.id, r.session_id, r.member_id, r.booking_date, r.status, r.cancellation_reason,
      r.cancelled_at, r.checked_in, r.check_in_time, r.notes, r.created_at, r.updated_at
    );
  }

  static async getAll() {
    return this.query("SELECT * FROM bookings ORDER BY booking_date DESC")
      .then(rows => rows.map(row => this.tableToModel(row)));
  }

  static async getAllWithDetails() {
    const rows = await this.query(`
        SELECT 
            b.id, b.status, b.booking_date, b.cancellation_reason,
            b.cancelled_at, b.checked_in, b.check_in_time, b.notes,
            b.created_at, b.updated_at,
            b.session_id, b.member_id,
            CONCAT(u.first_name, ' ', u.last_name) as member_name,
            s.date as session_date,
            s.start_time,
            s.end_time,
            a.name as activity_name,
            l.name as location_name
        FROM bookings b
        JOIN users u ON b.member_id = u.id
        JOIN sessions s ON b.session_id = s.id
        JOIN activities a ON s.activity_id = a.id
        JOIN locations l ON s.location_id = l.id
        ORDER BY b.created_at DESC
    `);


    return rows.map(row => ({
      id: row.b.id,
      session_id: row.b.session_id,
      member_id: row.b.member_id,
      status: row.b.status,
      booking_date: row.b.booking_date,
      created_at: row.b.created_at,
      updated_at: row.b.updated_at,
      checked_in: row.b.checked_in,
      cancellation_reason: row.b.cancellation_reason,
      cancelled_at: row.b.cancelled_at,
      check_in_time: row.b.check_in_time,
      notes: row.b.notes,
      member_name: row[''].member_name,
      session_date: row.s.session_date,
      start_time: row.s.start_time,
      end_time: row.s.end_time,
      activity_name: row.a.activity_name,
      location_name: row.l.location_name
    }));
  }

  static async getById(id) {
    return this.query("SELECT * FROM bookings WHERE id=?", [id]).then(rows =>
      rows.length ? this.tableToModel(rows[0]) : Promise.reject("not found")
    );
  }

  static async getByMember(member_id) {
    return this.query("SELECT * FROM bookings WHERE member_id=? ORDER BY booking_date DESC",
      [member_id]).then(rows => rows.map(row => this.tableToModel(row)));
  }

  static async create(b) {
    return this.query(
      `INSERT INTO bookings (session_id, member_id, status, checked_in)
         VALUES (?, ?, ?, ?)`,
      [
        b.session_id,
        b.member_id,
        b.status ?? "confirmed",
        b.checked_in ?? false
      ]
    );
  }

  static async update(b) {
    return this.query(
      `UPDATE bookings
       SET session_id=?, member_id=?, status=?, cancellation_reason=?, cancelled_at=?,
           checked_in=?, check_in_time=?, notes=?, updated_at=NOW()
       WHERE id=?`,
      [b.session_id, b.member_id, b.status, b.cancellation_reason, b.cancelled_at,
      !!b.checked_in, b.check_in_time, b.notes, b.id]
    );
  }

  static async delete(id) {
    return this.query("DELETE FROM bookings WHERE id=?", [id]).then(r => r.affectedRows ?
      r : Promise.reject("not found"));
  }
}