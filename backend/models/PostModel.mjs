import { DatabaseModel } from "./DatabaseModel.mjs";

export class PostModel extends DatabaseModel {
  constructor(id, user_id, title, content, category, tags, is_featured, comments_count,
    status, published_at, created_at, updated_at) {
    super();
    this.id = id;
    this.user_id = user_id;
    this.title = title;
    this.content = content;
    this.category = category;
    this.tags = tags;
    this.is_featured = is_featured;
    this.comments_count = comments_count;
    this.status = status;
    this.published_at = published_at;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static tableToModel(row) {
    const r = row.posts;
    return new PostModel(
      r.id, r.user_id, r.title, r.content, r.category, r.tags, r.is_featured, r.comments_count,
      r.status, r.published_at, r.created_at, r.updated_at
    );
  }

  static async getAll() {
    return this.query("SELECT * FROM posts ORDER BY created_at DESC")
      .then(rows => rows.map(row => this.tableToModel(row)));
  }

  static async getAllWithAuthors() {
    const rows = await this.query(`
        SELECT 
            p.id, p.user_id, p.title, p.content, p.category, 
            p.tags, p.is_featured, p.comments_count, p.status, 
            p.published_at, p.created_at, p.updated_at,
            CONCAT(u.first_name, ' ', u.last_name) as author_name
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `);

    return rows.map(row => ({
      id: row.p.id,
      user_id: row.p.user_id,
      title: row.p.title,
      content: row.p.content,
      category: row.p.category,
      tags: row.p.tags,
      is_featured: row.p.is_featured,
      comments_count: row.p.comments_count,
      status: row.p.status,
      published_at: row.p.published_at,
      created_at: row.p.created_at,
      updated_at: row.p.updated_at,
      author_name: row[''].author_name
    }));
  }
  static async getAllPublishedWithAuthors() {
    const rows = await this.query(`
        SELECT 
            p.id, p.user_id, p.title, p.content, p.category, 
            p.tags, p.is_featured, p.comments_count, p.status, 
            p.published_at, p.created_at, p.updated_at,
            CONCAT(u.first_name, ' ', u.last_name) as author_name
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC
    `);

    return rows.map(row => ({
      id: row.p.id,
      user_id: row.p.user_id,
      title: row.p.title,
      content: row.p.content,
      category: row.p.category,
      tags: row.p.tags,
      is_featured: row.p.is_featured,
      comments_count: row.p.comments_count,
      status: row.p.status,
      published_at: row.p.published_at,
      created_at: row.p.created_at,
      updated_at: row.p.updated_at,
      author_name: row[''].author_name
    }));
  }


  static async getById(id) {
    return this.query("SELECT * FROM posts WHERE id=?", [id]).then(rows =>
      rows.length ? this.tableToModel(rows[0]) : Promise.reject("not found")
    );
  }

  static async create(p) {
    return this.query(
      `INSERT INTO posts (user_id, title, content, category, tags, is_featured, 
      comments_count, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.user_id, p.title, p.content, p.category, p.tags, !!p.is_featured, p.comments_count ??
        0, p.status ?? "published", p.published_at ?? null]
    );
  }

  static async update(p) {
    return this.query(
      `UPDATE posts
       SET title=?, content=?, category=?, tags=?, is_featured=?, comments_count=?, status=?, 
       published_at=?, updated_at=NOW()
       WHERE id=?`,
      [p.title, p.content, p.category, p.tags, !!p.is_featured, p.comments_count, p.status, p.published_at, p.id]
    );
  }

  static async delete(id) {
    return this.query("DELETE FROM posts WHERE id=?", [id]).then(r => r.affectedRows ?
      r : Promise.reject("not found"));
  }
}