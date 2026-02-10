import { Database as SqlJsDatabase } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDatabase, saveDatabase } from '../database/connection';
import { User, CreateUserDto, UpdateUserDto, LoginDto } from '../../shared/types/entities';
import { UserRole } from '../../shared/types/enums';

export class AuthService {
    private static instance: AuthService;

    private constructor() { }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private get db(): SqlJsDatabase {
        return getDatabase();
    }

    /**
     * Hash password with salt
     */
    private hashPassword(password: string): { hash: string; salt: string } {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return { hash, salt };
    }

    /**
     * Verify password against hash and salt
     */
    private verifyPassword(password: string, hash: string, salt: string): boolean {
        const newHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return newHash === hash;
    }

    /**
     * Login user
     */
    public login(dto: LoginDto): User {
        const stmt = this.db.prepare(
            'SELECT * FROM users WHERE username = ?'
        );
        stmt.bind([dto.username]);

        if (!stmt.step()) {
            stmt.free();
            throw new Error('Invalid username or password');
        }

        const user = stmt.getAsObject() as any;
        stmt.free();

        if (!user.is_active) {
            throw new Error('User account is inactive');
        }

        if (!this.verifyPassword(dto.password || '', user.password_hash, user.salt)) {
            throw new Error('Invalid username or password');
        }

        // Update last login
        this.db.run(
            'UPDATE users SET last_login_at = datetime("now") WHERE id = ?',
            [user.id]
        );
        saveDatabase();

        return this.mapToUser(user);
    }

    /**
     * Create a new user
     */
    public createUser(dto: CreateUserDto): User {
        // Check if username already exists
        const checkStmt = this.db.prepare('SELECT id FROM users WHERE username = ?');
        checkStmt.bind([dto.username]);
        if (checkStmt.step()) {
            checkStmt.free();
            throw new Error('Username already exists');
        }
        checkStmt.free();

        const { hash, salt } = this.hashPassword(dto.password || 'password123');
        const id = uuidv4();
        const now = new Date().toISOString();

        this.db.run(`
      INSERT INTO users (
        id, username, password_hash, salt, role, 
        first_name, last_name, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            id,
            dto.username,
            hash,
            salt,
            dto.role || UserRole.USER,
            dto.firstName || null,
            dto.lastName || null,
            1, // isActive
            now,
            now
        ]);
        saveDatabase();

        return this.getUserById(id);
    }

    /**
     * Update user
     */
    public updateUser(id: string, dto: UpdateUserDto): User {
        const updates: string[] = [];
        const values: any[] = [];

        if (dto.firstName !== undefined) {
            updates.push('first_name = ?');
            values.push(dto.firstName);
        }
        if (dto.lastName !== undefined) {
            updates.push('last_name = ?');
            values.push(dto.lastName);
        }
        if (dto.role) {
            updates.push('role = ?');
            values.push(dto.role);
        }
        if (dto.isActive !== undefined) {
            updates.push('is_active = ?');
            values.push(dto.isActive ? 1 : 0);
        }
        if (dto.password) {
            const { hash, salt } = this.hashPassword(dto.password);
            updates.push('password_hash = ?');
            values.push(hash);
            updates.push('salt = ?');
            values.push(salt);
        }

        if (updates.length === 0) return this.getUserById(id);

        updates.push('updated_at = datetime("now")');
        values.push(id);

        this.db.run(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        saveDatabase();

        return this.getUserById(id);
    }

    /**
     * Delete user
     */
    public deleteUser(id: string): void {
        // Prevent deleting last admin
        const user = this.getUserById(id);
        if (user.role === UserRole.ADMIN) {
            const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = 1');
            stmt.bind([UserRole.ADMIN]);
            if (stmt.step()) {
                const count = stmt.getAsObject().count as number;
                if (count <= 1) {
                    stmt.free();
                    throw new Error('Cannot delete the last admin user');
                }
            }
            stmt.free();
        }

        this.db.run('DELETE FROM users WHERE id = ?', [id]);
        saveDatabase();
    }

    /**
     * Get user by ID
     */
    public getUserById(id: string): User {
        const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
        stmt.bind([id]);

        if (!stmt.step()) {
            stmt.free();
            throw new Error('User not found');
        }

        const user = stmt.getAsObject();
        stmt.free();

        return this.mapToUser(user);
    }

    /**
     * Get all users
     */
    public getAllUsers(): User[] {
        const stmt = this.db.prepare('SELECT * FROM users ORDER BY username ASC');
        const users: User[] = [];

        while (stmt.step()) {
            users.push(this.mapToUser(stmt.getAsObject()));
        }
        stmt.free();

        return users;
    }

    /**
     * Helper to map DB row to User object
     */
    private mapToUser(row: any): User {
        return {
            id: row.id as string,
            username: row.username as string,
            role: row.role as UserRole,
            firstName: row.first_name as string | null,
            lastName: row.last_name as string | null,
            isActive: Boolean(row.is_active),
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
            lastLoginAt: row.last_login_at as string | null,
        };
    }
}
